from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem, OrderApproval
from accounts.models import Customer, CreditAccount
from products.models import Product
from payments.models import PaymentRequest


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create a new purchase order"""
    try:
        # Get customer and credit account
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        # Extract data
        delivery_mode = request.data.get("delivery_mode", "DELIVERY")
        shipping_address = request.data.get("shipping_address", "")
        items = request.data.get("items", [])
        
        if not items:
            return Response(
                {"error": "Order must contain at least one item"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate total
        total_amount = Decimal("0.00")
        for item in items:
            quantity = Decimal(str(item["quantity"]))
            unit_price = Decimal(str(item["unit_price"]))
            total_amount += quantity * unit_price
        
        # Check if customer has enough available credit
        if total_amount > credit_account.available_credit:
            return Response(
                {
                    "error": "Insufficient credit",
                    "message": f"Order total (₱{total_amount}) exceeds available credit (₱{credit_account.available_credit})",
                    "required": str(total_amount),
                    "available": str(credit_account.available_credit)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create order and items in transaction
        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                account=credit_account,
                branch=credit_account.branch,
                delivery_mode=delivery_mode,
                shipping_address=shipping_address,
                total_amount=total_amount,
                order_status="PENDING"
            )
            
            # Create order items
            for item_data in items:
                product = Product.objects.get(product_id=item_data["product_id"])
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=Decimal(str(item_data["quantity"])),
                    unit_price=Decimal(str(item_data["unit_price"]))
                )
            
            # Reduce available credit (reserve it)
            credit_account.available_credit -= total_amount
            credit_account.save()
        
        return Response({
            "success": True,
            "order_id": order.order_id,
            "total_amount": str(total_amount),
            "message": "Order created successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except CreditAccount.DoesNotExist:
        return Response(
            {"error": "Credit account not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """Get a single order with its line items and customer info"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account

        order = Order.objects.get(order_id=order_id, account=credit_account)
        items = order.items.select_related('product').all()

        # Pull phone from the enrollment linked to the customer
        phone = ""
        if customer.application and customer.application.phone_number:
            phone = customer.application.phone_number

        items_data = []
        for item in items:
            items_data.append({
                'name': item.product.name,
                'quantity': str(item.quantity.normalize()),
                'unit_price': str(item.unit_price),
                'subtotal': str(item.subtotal),
            })

        return Response({
            'order_id': order.order_id,
            'date_submitted': order.date_ordered.strftime('%B %d, %Y'),
            'customer_name': request.user.get_full_name() or request.user.username,
            'phone': phone,
            'delivery_mode': order.delivery_mode,
            'shipping_address': order.shipping_address,
            'order_status': order.order_status,
            'total_amount': str(order.total_amount),
            'items': items_data,
        })

    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_orders(request):
    """Get all orders for the logged-in customer"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        orders = Order.objects.filter(account=credit_account).order_by('-date_ordered')
        
        data = []
        for order in orders:
            data.append({
                'order_id': order.order_id,
                'total_amount': str(order.total_amount),
                'order_status': order.order_status,
                'delivery_mode': order.delivery_mode,
                'date_ordered': order.date_ordered.strftime('%B %d, %Y'),
                'shipping_address': order.shipping_address
            })
        
        return Response(data)
        
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── Credit Manager endpoints ────────────────────────────────────────────────

def _require_role(request, role_name):
    """Return True if the user has the given group."""
    return request.user.groups.filter(name=role_name).exists()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_pending_orders(request):
    """Dashboard summary + list of PENDING orders for credit approval."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    pending = Order.objects.filter(order_status="PENDING").select_related(
        "account__customer__user",
        "account__customer__application",
    ).order_by("-date_ordered")

    orders_data = []
    for order in pending:
        customer = order.account.customer
        orders_data.append({
            "order_id": order.order_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "total_amount": str(order.total_amount),
            "date_ordered": order.date_ordered.strftime("%B %d, %Y"),
        })

    # Pending payment count
    pending_payment_count = PaymentRequest.objects.filter(payment_status="PENDING").count()

    return Response({
        "pending_credit_count": pending.count(),
        "pending_payment_count": pending_payment_count,
        "pending_orders": orders_data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_order_detail(request, order_id):
    """Full order detail for the credit-approval review screen."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.select_related(
            "account__customer__user",
            "account__customer__application",
        ).get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    customer = order.account.customer
    app = customer.application          # CreditEnrollment – may be None
    credit = order.account

    items_data = [
        {
            "name": item.product.name,
            "quantity": str(item.quantity.normalize()),
            "subtotal": str(item.subtotal),
        }
        for item in order.items.select_related("product").all()
    ]

    return Response({
        "order_id": order.order_id,
        "order_status": order.order_status,
        "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "email": app.email if app else customer.user.email,
        "items": items_data,
        "total_amount": str(order.total_amount),
        "available_credit": str(credit.available_credit),
        "credit_limit": str(credit.credit_limit),
        "outstanding_balance": str(credit.outstanding_bal),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_approve_order(request, order_id):
    """Approve a pending order – flip status, move amount to outstanding, record approval."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.select_related("account").get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "PENDING":
        return Response(
            {"error": "Only pending orders can be approved"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.utils import timezone

    with transaction.atomic():
        order.order_status = "APPROVED"
        order.save()

        credit = order.account
        credit.outstanding_bal += order.total_amount
        credit.save()

        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="APPROVED",
            approval_date=timezone.now(),
        )

    credit.refresh_from_db()
    return Response({
        "success": True,
        "order_id": order.order_id,
        "order_status": order.order_status,
        "available_credit": str(credit.available_credit),
        "credit_limit": str(credit.credit_limit),
        "outstanding_balance": str(credit.outstanding_bal),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_request_override(request, order_id):
    """Request an override for an order that exceeds available credit"""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.select_related("account").get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "PENDING":
        return Response(
            {"error": "Only pending orders can have override requests"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reason = request.data.get("reason", "").strip()
    if not reason:
        return Response(
            {"error": "Reason for override is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from .models import OverrideRequest
    from django.utils import timezone

    # Create override request
    OverrideRequest.objects.create(
        requesting_user=request.user,
        order=order,
        reason=reason,
        override_status="PENDING",
    )

    return Response({
        "success": True,
        "order_id": order.order_id,
        "message": "Override request submitted successfully",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_reject_order(request, order_id):
    """Reject a pending order – flip status, return reserved credit, record rejection."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.select_related("account").get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "PENDING":
        return Response(
            {"error": "Only pending orders can be rejected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.utils import timezone

    with transaction.atomic():
        order.order_status = "REJECTED"
        order.save()

        # Return the reserved credit to the customer
        credit = order.account
        credit.available_credit += order.total_amount
        credit.save()

        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="REJECTED",
            approval_date=timezone.now(),
        )

    return Response({
        "success": True,
        "order_id": order.order_id,
        "order_status": order.order_status,
    })