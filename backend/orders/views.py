from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from decimal import Decimal, InvalidOperation
from datetime import datetime

from .models import Order, OrderItem, OrderApproval
from accounts.models import Customer, CreditAccount, log_audit
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
        available = credit_account.credit_limit - credit_account.outstanding_bal
        exceeds_credit = total_amount > available
        
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
                'quantity': f'{item.quantity:.10g}',
                'unit_price': str(item.unit_price),
                'subtotal': str(item.subtotal),
            })

        # Check for rejection info
        rejection_reason = ""
        rejected_by = ""
        rejection_date = ""
        rejection = OrderApproval.objects.filter(order=order, approval_status="REJECTED").first()
        if rejection:
            rejection_reason = rejection.notes or ""
            rejected_by = rejection.user.username if rejection.user else ""
            rejection_date = rejection.approval_date.strftime('%B %d, %Y at %I:%M %p') if rejection.approval_date else ""

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
            'rejection_reason': rejection_reason,
            'rejected_by': rejected_by,
            'rejection_date': rejection_date,
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
def cm_all_orders(request):
    """All orders (any status) for the credit manager View All tab."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    orders = Order.objects.select_related(
        "account__customer__user",
        "account__customer__application",
    ).order_by("-date_ordered")

    data = []
    for order in orders:
        customer = order.account.customer
        data.append({
            "order_id": order.order_id,
            "amount": str(order.total_amount),
            "date_ordered": order.date_ordered.strftime("%B %d, %Y"),
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "status": order.order_status,
        })

    return Response(data)


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
            "quantity": f'{item.quantity:.10g}',
            "subtotal": str(item.subtotal),
        }
        for item in order.items.select_related("product").all()
    ]

    # Check for rejection info
    rejection_reason = ""
    rejected_by = ""
    rejection_date = ""
    rejection = OrderApproval.objects.filter(order=order, approval_status="REJECTED").first()
    if rejection:
        rejection_reason = rejection.notes or ""
        rejected_by = rejection.user.username if rejection.user else ""
        rejection_date = rejection.approval_date.strftime("%B %d, %Y at %I:%M %p") if rejection.approval_date else ""

    return Response({
        "order_id": order.order_id,
        "order_status": order.order_status,
        "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "email": app.email if app else customer.user.email,
        "items": items_data,
        "total_amount": str(order.total_amount),
        "available_credit": str(credit.credit_limit - credit.outstanding_bal),
        "credit_limit": str(credit.credit_limit),
        "outstanding_balance": str(credit.outstanding_bal),
        "rejection_reason": rejection_reason,
        "rejected_by": rejected_by,
        "rejection_date": rejection_date,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_approve_order(request, order_id):
    """Approve a pending order – flip status, move amount to outstanding, record approval."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(password):
        return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        order = Order.objects.select_related("account__customer__user").get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "PENDING":
        return Response(
            {"error": "Only pending orders can be approved"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.utils import timezone
    from django.core.mail import send_mail

    with transaction.atomic():
        order.order_status = "APPROVED"
        order.save()

        credit = order.account
        credit.available_credit -= order.total_amount
        credit.outstanding_bal += order.total_amount
        credit.save()

        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="APPROVED",
            approval_date=timezone.now(),
        )

    credit.refresh_from_db()

    # Send order approval email to customer
    customer_user = order.account.customer.user
    try:
        send_mail(
            subject=f"Your Order {order.order_id} Has Been Approved!",
            message=f"""
Hello {customer_user.get_full_name()},

Your order (Order ID: {order.order_id}) amounting to ₱{order.total_amount:,.2f} has been approved.

Your updated credit details:
- Available Credit: ₱{credit.available_credit:,.2f}
- Credit Limit: ₱{credit.credit_limit:,.2f}
- Outstanding Balance: ₱{credit.outstanding_bal:,.2f}

Thank you for your purchase!

Best regards,
Mylora Web Credit System
            """,
            from_email="noreply@mylora.com",
            recipient_list=[customer_user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Email sending failed: {e}")

    log_audit(user=request.user, action="APPROVE_ORDER", details={"order_id": order_id}, request=request)
    return Response({
        "success": True,
        "order_id": order.order_id,
        "order_status": order.order_status,
        "available_credit": str(credit.credit_limit - credit.outstanding_bal),
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

    log_audit(user=request.user, action="REQUEST_OVERRIDE", details={"order_id": order_id, "reason": reason}, request=request)
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

    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(password):
        return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

    rejection_reason = request.data.get("rejection_reason", "").strip()
    if len(rejection_reason.split()) < 5:
        return Response(
            {"error": "Please provide at least 5 words for the rejection reason."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        order = Order.objects.select_related("account__customer__user").get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "PENDING":
        return Response(
            {"error": "Only pending orders can be rejected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.utils import timezone
    from django.core.mail import send_mail

    with transaction.atomic():
        order.order_status = "REJECTED"
        order.save()

        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="REJECTED",
            approval_date=timezone.now(),
            notes=rejection_reason,
        )

    # Send rejection email to customer
    customer_user = order.account.customer.user
    try:
        send_mail(
            subject=f"Your Order {order.order_id} Has Been Rejected",
            message=f"""
Hello {customer_user.get_full_name()},

We regret to inform you that your order (Order ID: {order.order_id}) amounting to \u20B1{order.total_amount:,.2f} has been rejected.

Reason for rejection:
{rejection_reason}

If you have any questions, please contact your branch for further assistance.

Best regards,
Mylora Web Credit System
            """,
            from_email="noreply@mylora.com",
            recipient_list=[customer_user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Email sending failed: {e}")

    log_audit(user=request.user, action="REJECT_ORDER", details={"order_id": order_id, "rejection_reason": rejection_reason}, request=request)
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
def um_pending_orders(request):
    """List of orders pending credit approval or processing"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Get orders that are PENDING (need credit approval) or APPROVED (need processing)
    pending_orders = Order.objects.filter(
        order_status__in=["PENDING", "APPROVED"]
    ).select_related(
        "account__customer__user"
    ).order_by("-date_ordered")

    data = []
    for order in pending_orders:
        customer = order.account.customer
        data.append({
            "order_id": order.order_id,
            "customer_id": customer.id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
            "status": order.order_status,
            "amount": str(order.total_amount),
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
            "quantity": f'{item.quantity:.10g}',
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
        "available_credit": str(credit.credit_limit - credit.outstanding_bal),
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

        # Deduct available credit and move to outstanding balance
        credit = order.account
        credit.available_credit -= order.total_amount
        credit.outstanding_bal += order.total_amount
        credit.save()

        # Record the approval
        OrderApproval.objects.create(
            user=request.user,
            order=order,
            approval_status="APPROVED",
            approval_date=timezone.now(),
        )

    log_audit(user=request.user, action="APPROVE_OVERRIDE", details={"override_id": override_id, "order_id": order.order_id}, request=request)
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

        # Reject the order
        order = override_req.order
        order.order_status = "REJECTED"
        order.save()

    log_audit(user=request.user, action="REJECT_OVERRIDE", details={"override_id": override_id}, request=request)
    return Response({
        "success": True,
        "override_id": override_req.override_id,
        "message": "Override request rejected",
    })


# ─── Credit Manager - Customer Management ────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_customers_list(request):
    """List all customers with their credit account details"""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from accounts.models import Customer
    
    customers = Customer.objects.select_related(
        "user", "credit_account", "application"
    ).all()

    data = []
    for customer in customers:
        try:
            # Skip customers without credit accounts
            if not hasattr(customer, 'credit_account') or not customer.credit_account:
                continue
                
            app = customer.application
            credit = customer.credit_account
            data.append({
                "customer_id": customer.id,
                "name": customer.user.get_full_name() or customer.user.username,
                "phone": app.phone_number if app else "",
                "email": app.email if app else customer.user.email,
                "address1": app.address1 if app else "",
                "address2": app.address2 if app else "",
                "barangay": app.barangay if app else "",
                "city": app.city if app else "",
                "zipcode": app.zipcode if app else "",
                "credit_limit": str(credit.credit_limit),
                "available_credit": str(credit.available_credit),
                "outstanding_balance": str(credit.outstanding_bal),
            })
        except Exception as e:
            # Skip customers with errors
            print(f"Error loading customer {customer.id}: {str(e)}")
            continue

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_customer_history(request, customer_id):
    """Get payment history for a specific customer"""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from accounts.models import Customer
    from payments.models import PaymentRequest
    
    try:
        customer = Customer.objects.select_related("credit_account").get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get all payment requests for this customer's credit account
    payments = PaymentRequest.objects.filter(
        account=customer.credit_account
    ).select_related("approved_by").order_by("-date_paid")

    data = []
    for payment in payments:
        data.append({
            "payment_id": payment.payment_id,
            "inv_number": payment.inv_number,
            "amount_paid": str(payment.amount_paid),
            "date_paid": payment.date_paid.strftime("%B %d, %Y"),
            "payment_status": payment.payment_status,
            "approved_by": payment.approved_by.username if payment.approved_by else None,
        })

    return Response(data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_adjust_customer_balance(request, customer_id):
    """Manually adjust a customer's outstanding balance"""
    if not _require_role(request, "credit_manager"):
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

    from accounts.models import Customer
    from payments.models import PaymentRequest
    from django.utils import timezone

    try:
        customer = Customer.objects.select_related("credit_account").get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get adjustment details
    balance_paid = request.data.get("balance_paid")
    date_of_payment = request.data.get("date_of_payment")
    invoice_number = request.data.get("invoice_number", "")
    proof_of_payment = request.FILES.get("proof_of_payment")

    # Validate required fields
    if not balance_paid:
        return Response(
            {"error": "Balance paid is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not date_of_payment:
        return Response(
            {"error": "Date of payment is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Convert and validate amount
    try:
        amount_decimal = Decimal(str(balance_paid))
        if amount_decimal <= 0:
            return Response(
                {"error": "Amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (InvalidOperation, ValueError):
        return Response(
            {"error": f"Invalid amount format: {balance_paid}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Convert and validate date
    try:
        date_obj = datetime.strptime(date_of_payment, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"error": f"Invalid date format. Expected YYYY-MM-DD, got: {date_of_payment}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get credit account and validate
    credit = customer.credit_account
    outstanding = Decimal(str(credit.outstanding_bal))
    available = Decimal(str(credit.available_credit))
    limit = Decimal(str(credit.credit_limit))

    # Check if payment exceeds outstanding balance
    if amount_decimal > outstanding:
        return Response(
            {"error": f"Payment amount (₱{amount_decimal}) exceeds outstanding balance (₱{outstanding})"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate new balances
    new_outstanding = outstanding - amount_decimal
    new_available = available + amount_decimal
    
    # Ensure available doesn't exceed limit
    if new_available > limit:
        new_available = limit

    with transaction.atomic():
        # Create a payment request record for audit trail
        payment = PaymentRequest.objects.create(
            account=customer.credit_account,
            inv_number=invoice_number,
            amount_paid=amount_decimal,
            date_paid=date_obj,
            proof_payment=proof_of_payment,
            payment_status="VERIFIED",
            approved_by=request.user,
        )

        # Update credit account with new calculated values
        credit.outstanding_bal = new_outstanding
        credit.available_credit = new_available
        credit.save()

    log_audit(user=request.user, action="ADJUST_BALANCE", details={"customer_id": customer_id, "amount": str(amount_decimal)}, request=request)
    # Return updated customer data
    app = customer.application
    return Response({
        "success": True,
        "message": "Balance adjusted successfully",
        "payment_id": payment.payment_id,
        "new_outstanding_balance": str(new_outstanding),
        "new_available_credit": str(new_available),
        "customer": {
            "customer_id": customer.id,
            "name": customer.user.get_full_name() or customer.user.username,
            "phone": app.phone_number if app else "",
            "email": app.email if app else customer.user.email,
            "address1": app.address1 if app else "",
            "address2": app.address2 if app else "",
            "barangay": app.barangay if app else "",
            "city": app.city if app else "",
            "zipcode": app.zipcode if app else "",
            "credit_limit": str(limit),
            "available_credit": str(new_available),
            "outstanding_balance": str(new_outstanding),
        }
    })

# ─── Order Processor Endpoints ────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def op_pending_orders(request):
    """List of APPROVED orders ready for processing"""
    if not _require_role(request, "order_processor"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Get all approved orders that haven't been completed
    from .models import OrderCompletion
    
    approved_orders = Order.objects.filter(order_status="APPROVED").select_related(
        "account__customer__user"
    ).order_by("-date_ordered")

    # Exclude orders that are already completed
    completed_order_ids = OrderCompletion.objects.filter(
        completion_status="COMPLETED"
    ).values_list("order_id", flat=True)

    approved_orders = approved_orders.exclude(order_id__in=completed_order_ids)

    data = []
    for order in approved_orders:
        customer = order.account.customer
        data.append({
            "order_id": order.order_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "order_status": order.order_status,
            "date_ordered": order.date_ordered.strftime("%B %d, %Y"),
            "total_amount": str(order.total_amount),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def op_order_detail(request, order_id):
    """Get order details for processing"""
    if not _require_role(request, "order_processor"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.select_related(
            "account__customer__user",
            "account__customer__application",
            "branch"
        ).get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "APPROVED":
        return Response(
            {"error": "Only approved orders can be processed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    customer = order.account.customer
    app = customer.application

    items_data = [
        {
            "name": item.product.name,
            "quantity": f'{item.quantity:.10g}',
            "subtotal": str(item.subtotal),
        }
        for item in order.items.select_related("product").all()
    ]

    # Get approval info
    approval = OrderApproval.objects.filter(order=order, approval_status="APPROVED").first()

    return Response({
        "order_id": order.order_id,
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "items": items_data,
        "total_amount": str(order.total_amount),
        "shipping_address": order.shipping_address,
        "delivery_mode": order.delivery_mode,
        "branch_name": order.branch.name if order.branch else "",
        "branch_address": order.branch.address if order.branch else "",
        "approval_date": approval.approval_date.strftime("%B %d, %Y at %I:%M %p") if approval else "",
        "approved_by": approval.user.username if approval else "",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def op_complete_order(request, order_id):
    """Mark an order as completed"""
    if not _require_role(request, "order_processor"):
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

    from .models import OrderCompletion
    from django.utils import timezone
    
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != "APPROVED":
        return Response(
            {"error": "Only approved orders can be completed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already completed
    existing_completion = OrderCompletion.objects.filter(order=order).first()
    if existing_completion:
        return Response(
            {"error": "Order is already marked as completed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        # Create completion record
        completion = OrderCompletion.objects.create(
            order=order,
            user=request.user,
            completion_status="COMPLETED",
            completion_date=timezone.now(),
        )

        # Update order status
        order.order_status = "COMPLETED"
        order.save()

    log_audit(user=request.user, action="COMPLETE_ORDER", details={"order_id": order_id}, request=request)
    return Response({
        "success": True,
        "order_id": order.order_id,
        "message": "Order marked as completed successfully",
        "processed_by": request.user.username,
        "completion_date": completion.completion_date.strftime("%B %d, %Y at %I:%M %p") if completion.completion_date else "",
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def op_completed_orders(request):
    """List of completed orders"""
    if not _require_role(request, "order_processor"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import OrderCompletion
    
    # Get all completed orders
    completed_order_ids = OrderCompletion.objects.filter(
        completion_status="COMPLETED"
    ).values_list("order_id", flat=True)

    completed_orders = Order.objects.filter(
        order_id__in=completed_order_ids
    ).select_related("account__customer__user").order_by("-date_ordered")

    data = []
    for order in completed_orders:
        customer = order.account.customer
        completion = OrderCompletion.objects.get(order=order)
        
        data.append({
            "order_id": order.order_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "order_status": "COMPLETED",
            "date_ordered": order.date_ordered.strftime("%B %d, %Y"),
            "completion_date": completion.completion_date.strftime("%B %d, %Y"),
            "total_amount": str(order.total_amount),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def op_order_view(request, order_id):
    """View completed order details"""
    if not _require_role(request, "order_processor"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import OrderCompletion
    
    try:
        order = Order.objects.select_related(
            "account__customer__user",
            "account__customer__application",
            "branch"
        ).get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if order is completed
    try:
        completion = OrderCompletion.objects.select_related("user").get(order=order)
    except OrderCompletion.DoesNotExist:
        return Response(
            {"error": "Order has not been completed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    customer = order.account.customer
    app = customer.application

    items_data = [
        {
            "name": item.product.name,
            "quantity": f'{item.quantity:.10g}',
            "subtotal": str(item.subtotal),
        }
        for item in order.items.select_related("product").all()
    ]

    # Get approval info
    approval = OrderApproval.objects.filter(order=order, approval_status="APPROVED").first()

    return Response({
        "order_id": order.order_id,
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "items": items_data,
        "total_amount": str(order.total_amount),
        "shipping_address": order.shipping_address,
        "delivery_mode": order.delivery_mode,
        "branch_name": order.branch.name if order.branch else "",
        "branch_address": order.branch.address if order.branch else "",
        "approval_date": approval.approval_date.strftime("%B %d, %Y at %I:%M %p") if approval else "",
        "approved_by": approval.user.username if approval else "",
        "completion_date": completion.completion_date.strftime("%B %d, %Y at %I:%M %p"),
        "processed_by": completion.user.username,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_order_view(request, order_id):
    """View order details for upper management (any status)"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import OrderCompletion

    try:
        order = Order.objects.select_related(
            "account__customer__user",
            "account__customer__application",
            "branch"
        ).get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    customer = order.account.customer
    app = customer.application

    items_data = [
        {
            "name": item.product.name,
            "quantity": f'{item.quantity:.10g}',
            "subtotal": str(item.subtotal),
        }
        for item in order.items.select_related("product").all()
    ]

    approval = OrderApproval.objects.filter(order=order, approval_status="APPROVED").first()
    rejection = OrderApproval.objects.filter(order=order, approval_status="REJECTED").first()

    try:
        completion = OrderCompletion.objects.select_related("user").get(order=order)
        processed_by = completion.user.username
        completion_date = completion.completion_date.strftime("%B %d, %Y at %I:%M %p") if completion.completion_date else ""
    except OrderCompletion.DoesNotExist:
        processed_by = ""
        completion_date = ""

    return Response({
        "order_id": order.order_id,
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
        "items": items_data,
        "total_amount": str(order.total_amount),
        "shipping_address": order.shipping_address,
        "delivery_mode": order.delivery_mode,
        "branch_name": order.branch.name if order.branch else "",
        "branch_address": order.branch.address if order.branch else "",
        "approval_date": approval.approval_date.strftime("%B %d, %Y at %I:%M %p") if approval else "",
        "approved_by": approval.user.username if approval else "",
        "completion_date": completion_date,
        "processed_by": processed_by,
        "order_status": order.order_status,
        "rejection_reason": rejection.notes if rejection else "",
        "rejected_by": rejection.user.username if rejection and rejection.user else "",
        "rejection_date": rejection.approval_date.strftime("%B %d, %Y at %I:%M %p") if rejection and rejection.approval_date else "",
    })


# ─── Upper Management Customer Endpoints ───────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_customers_list(request):
    """Get list of all customers for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from accounts.models import Customer
    
    customers = Customer.objects.select_related(
        "credit_account", "application"
    ).all()

    data = []
    for customer in customers:
        try:
            if not hasattr(customer, 'credit_account') or not customer.credit_account:
                continue
                
            app = customer.application
            credit = customer.credit_account
            data.append({
                "customer_id": customer.id,
                "name": customer.user.get_full_name() or customer.user.username,
                "phone": app.phone_number if app else "",
                "email": app.email if app else customer.user.email,
                "credit_limit": str(credit.credit_limit),
                "outstanding_balance": str(credit.outstanding_bal),
            })
        except Exception as e:
            print(f"Error loading customer {customer.id}: {str(e)}")
            continue

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_customer_detail(request, customer_id):
    """Get detailed customer information"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from accounts.models import Customer
    
    try:
        customer = Customer.objects.select_related("credit_account", "application").get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    if not hasattr(customer, 'credit_account') or not customer.credit_account:
        return Response({"error": "Customer has no credit account"}, status=status.HTTP_400_BAD_REQUEST)

    app = customer.application
    credit = customer.credit_account

    return Response({
        "customer_id": customer.id,
        "name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "email": app.email if app else customer.user.email,
        "address1": app.address1 if app else "",
        "address2": app.address2 if app else "",
        "barangay": app.barangay if app else "",
        "city": app.city if app else "",
        "zipcode": app.zipcode if app else "",
        "credit_limit": str(credit.credit_limit),
        "available_credit": str(credit.available_credit),
        "outstanding_balance": str(credit.outstanding_bal),
        "credit_term": str(credit.credit_term) if credit.credit_term else None,
        "credit_type": app.credit_amt_request if app else None,
        "documents": [],
        "gov_id": None,
        "notes": None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_update_customer_balance(request, customer_id):
    """Update customer balance (same as credit manager)"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.check_password(password):
        return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

    from accounts.models import Customer
    from payments.models import PaymentRequest
    from decimal import Decimal
    from django.utils import timezone
    
    try:
        customer = Customer.objects.select_related("credit_account").get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    if not customer.credit_account:
        return Response({"error": "Customer has no credit account"}, status=status.HTTP_400_BAD_REQUEST)

    credit = customer.credit_account
    invoice_number = request.data.get("invoice_number", "")
    balance_paid = request.data.get("balance_paid")
    date_of_payment = request.data.get("date_of_payment")

    if not balance_paid or not date_of_payment:
        return Response(
            {"error": "Balance paid and date of payment are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        amount = Decimal(str(balance_paid))
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (ValueError, TypeError):
        return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Create payment request record (auto-verified by upper management)
        PaymentRequest.objects.create(
            account=credit,
            inv_number=invoice_number,
            amount_paid=amount,
            date_paid=date_of_payment,
            proof_payment=request.FILES.get("proof_of_payment"),
            approved_by=request.user,
            timestamp=timezone.now(),
            payment_status="VERIFIED",
        )

        # Update credit account
        credit.outstanding_bal -= amount
        credit.available_credit += amount
        credit.save()

    log_audit(user=request.user, action="UPDATE_BALANCE", details={"customer_id": customer_id, "amount": str(amount)}, request=request)
    # Return updated customer data
    app = customer.application
    return Response({
        "success": True,
        "message": "Balance updated successfully",
        "customer": {
            "customer_id": customer.id,
            "name": customer.user.get_full_name() or customer.user.username,
            "phone": app.phone_number if app else "",
            "email": app.email if app else customer.user.email,
            "address1": app.address1 if app else "",
            "address2": app.address2 if app else "",
            "barangay": app.barangay if app else "",
            "city": app.city if app else "",
            "zipcode": app.zipcode if app else "",
            "credit_limit": str(credit.credit_limit),
            "available_credit": str(credit.available_credit),
            "outstanding_balance": str(credit.outstanding_bal),
            "credit_term": str(credit.credit_term) if credit.credit_term else None,
            "credit_type": app.credit_amt_request if app else None,
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_delete_customer(request, customer_id):
    """Delete a customer account"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.check_password(password):
        return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

    from accounts.models import Customer
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        customer = Customer.objects.select_related("user", "credit_account").get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if customer has outstanding balance
    if customer.credit_account and customer.credit_account.outstanding_bal > 0:
        return Response(
            {"error": "Cannot delete customer with outstanding balance"},
            status=status.HTTP_400_BAD_REQUEST
        )

    customer_name = customer.user.get_full_name() or customer.user.username
    with transaction.atomic():
        user = customer.user
        # Delete customer (cascade will handle related records)
        customer.delete()
        # Delete user account
        user.delete()

    log_audit(user=request.user, action="DELETE_CUSTOMER", details={"customer_id": customer_id, "customer_name": customer_name}, request=request)
    return Response({"success": True, "message": "Customer deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_customer_orders(request, customer_id):
    """Get all orders for a customer"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from accounts.models import Customer
    
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    if not customer.credit_account:
        return Response([])

    orders = Order.objects.filter(account=customer.credit_account).order_by("-date_ordered")

    data = []
    for order in orders:
        data.append({
            "order_id": order.order_id,
            "date_ordered": order.date_ordered.strftime("%B %d, %Y"),
            "total_amount": str(order.total_amount),
            "order_status": order.order_status,
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_all_orders(request):
    """Get all orders in the system for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Get all orders with related customer data
    orders = Order.objects.select_related(
        "account__customer__user",
        "account__customer__application"
    ).order_by("-date_ordered")

    data = []
    for order in orders:
        customer = order.account.customer
        data.append({
            "order_id": order.order_id,
            "customer_id": customer.id,
            "amount": str(order.total_amount),
            "date_submitted": order.date_ordered.strftime("%B %d, %Y"),
            "ordered_by": customer.user.get_full_name() or customer.user.username,
            "status": order.order_status,
        })

    return Response(data)