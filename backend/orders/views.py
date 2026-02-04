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
        
        # Allow orders that exceed credit limit - they will require override approval
        exceeds_credit = total_amount > credit_account.available_credit
        
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
            # If order exceeds limit, available_credit may go negative
            credit_account.available_credit -= total_amount
            credit_account.save()
        
        return Response({
            "success": True,
            "order_id": order.order_id,
            "total_amount": str(total_amount),
            "exceeds_credit": exceeds_credit,
            "message": "Order created successfully" if not exceeds_credit else "Order submitted for override approval"
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

    from .models import OverrideRequest

    # Get all pending orders
    pending = Order.objects.filter(order_status="PENDING").select_related(
        "account__customer__user",
        "account__customer__application",
    ).order_by("-date_ordered")

    # Exclude orders that have pending override requests
    pending_override_order_ids = OverrideRequest.objects.filter(
        override_status="PENDING"
    ).values_list("order_id", flat=True)

    pending = pending.exclude(order_id__in=pending_override_order_ids)

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


# ─── Upper Management Override Endpoints ──────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_pending_overrides(request):
    """List of PENDING override requests for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import OverrideRequest
    
    pending = (
        OverrideRequest.objects.filter(override_status="PENDING")
        .select_related("order__account__customer__user", "requesting_user")
        .order_by("-order__date_ordered")
    )

    data = []
    for override_req in pending:
        customer = override_req.order.account.customer
        data.append({
            "override_id": override_req.override_id,
            "order_id": override_req.order.order_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "date_submitted": override_req.order.date_ordered.strftime("%B %d, %Y"),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_override_detail(request, override_id):
    """Get detailed override request information"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import OverrideRequest
    
    try:
        override_req = OverrideRequest.objects.select_related(
            "order__account__customer__user",
            "order__account__customer__application",
            "requesting_user"
        ).get(override_id=override_id)
    except OverrideRequest.DoesNotExist:
        return Response({"error": "Override request not found"}, status=status.HTTP_404_NOT_FOUND)

    order = override_req.order
    customer = order.account.customer
    app = customer.application
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
        "override_id": override_req.override_id,
        "order_id": order.order_id,
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "date_submitted": override_req.order.date_ordered.strftime("%B %d, %Y"),
        "order_date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "items": items_data,
        "total_amount": str(order.total_amount),
        "available_credit": str(credit.available_credit),
        "credit_limit": str(credit.credit_limit),
        "outstanding_balance": str(credit.outstanding_bal),
        "reason": override_req.reason,
        "requesting_user": override_req.requesting_user.username,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_approve_override(request, override_id):
    """Approve an override request - directly approves the order"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not request.user.check_password(password):
        return Response(
            {"error": "Invalid password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    from .models import OverrideRequest
    from django.utils import timezone
    
    try:
        override_req = OverrideRequest.objects.select_related("order__account").get(override_id=override_id)
    except OverrideRequest.DoesNotExist:
        return Response({"error": "Override request not found"}, status=status.HTTP_404_NOT_FOUND)

    if override_req.override_status != "PENDING":
        return Response(
            {"error": "Only pending override requests can be approved"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        # Update override request
        override_req.override_status = "APPROVED"
        override_req.approving_user = request.user
        override_req.override_date = timezone.now()
        override_req.save()

        # Approve the order directly
        order = override_req.order
        order.order_status = "APPROVED"
        order.save()

        # Move amount from reserved to outstanding balance
        credit = order.account
        credit.outstanding_bal += order.total_amount
        credit.save()

        # Record the approval
        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="APPROVED",
            approval_date=timezone.now(),
        )

    return Response({
        "success": True,
        "override_id": override_req.override_id,
        "message": "Override request approved and order approved successfully",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_reject_override(request, override_id):
    """Reject an override request - order remains in pending with reserved negative credit"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not request.user.check_password(password):
        return Response(
            {"error": "Invalid password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    from .models import OverrideRequest
    from django.utils import timezone
    
    try:
        override_req = OverrideRequest.objects.select_related("order__account").get(override_id=override_id)
    except OverrideRequest.DoesNotExist:
        return Response({"error": "Override request not found"}, status=status.HTTP_404_NOT_FOUND)

    if override_req.override_status != "PENDING":
        return Response(
            {"error": "Only pending override requests can be rejected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        # Update override request
        override_req.override_status = "REJECTED"
        override_req.approving_user = request.user
        override_req.override_date = timezone.now()
        override_req.save()

        # Reject the order and return reserved credit
        order = override_req.order
        order.order_status = "REJECTED"
        order.save()

        # Return the reserved credit
        credit = order.account
        credit.available_credit += order.total_amount
        credit.save()

    return Response({
        "success": True,
        "override_id": override_req.override_id,
        "message": "Override request rejected",
    })