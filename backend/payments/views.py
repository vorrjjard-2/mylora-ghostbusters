from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
from datetime import datetime
from django.db import transaction

from .models import PaymentRequest
from accounts.models import Customer, log_audit, Notification
import posthog
from posthog import new_context, identify_context, capture


def _require_role(request, role_name):
    return request.user.groups.filter(name=role_name).exists()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_payment(request):
    """Customer submits a payment request"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        # Extract payment data (inv_number is auto-generated)
        amount_paid = request.data.get("amount_paid")
        date_paid = request.data.get("date_paid")
        proof_payment = request.FILES.get("proof_payment")
        payment_type = request.data.get("payment_type", "")
        
        # Validate required fields
        if not amount_paid:
            return Response(
                {"error": "Amount paid is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not date_paid:
            return Response(
                {"error": "Payment date is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not proof_payment:
            return Response(
                {"error": "Proof of payment is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount to Decimal
        try:
            amount_decimal = Decimal(str(amount_paid))
            if amount_decimal <= 0:
                return Response(
                    {"error": "Amount must be greater than zero"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (InvalidOperation, ValueError):
            return Response(
                {"error": "Invalid amount format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse date
        try:
            date_obj = datetime.strptime(date_paid, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Disallow dates beyond today + credit_term days
        from datetime import date as date_type, timedelta
        credit_term = credit_account.credit_term or 0
        max_date = date_type.today() + timedelta(days=credit_term + 1)
        if date_obj > max_date:
            return Response(
                {"error": f"Date of payment cannot exceed today + {credit_term} days (your credit term)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create payment request (inv_number auto-generated after save)
        payment = PaymentRequest.objects.create(
            account=credit_account,
            amount_paid=amount_decimal,
            date_paid=date_obj,
            proof_payment=proof_payment,
            payment_type=payment_type,
            payment_status="PENDING"
        )

        # Auto-generate invoice number based on payment_id
        payment.inv_number = f"INV-{payment.payment_id:06d}"
        payment.save(update_fields=["inv_number"])

        with new_context():
            identify_context(str(request.user.id))
            capture('payment_submitted', properties={
                'amount_paid': float(amount_decimal),
                'payment_type': payment_type,
            })

        return Response({
            "success": True,
            "payment_id": payment.payment_id,
            "inv_number": payment.inv_number,
            "message": "Payment request submitted successfully"
        }, status=status.HTTP_201_CREATED)
        
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
def customer_payment_history(request):
    """Get payment/credit history for the logged-in customer"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account

        payments = PaymentRequest.objects.filter(
            account=credit_account
        ).order_by("-timestamp")

        data = []
        for p in payments:
            data.append({
                "payment_id": p.payment_id,
                "inv_number": p.inv_number or "",
                "amount_paid": str(p.amount_paid),
                "date_paid": p.date_paid.strftime("%B %d, %Y"),
                "date_submitted": p.timestamp.strftime("%B %d, %Y"),
                "payment_status": p.payment_status,
                "payment_type": p.payment_type or "",
                "approved_by": p.approved_by.get_full_name() or p.approved_by.username if p.approved_by else None,
                "rejection_reason": p.rejection_reason or "",
            })

        return Response(data)
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_all_payments(request):
    """All payment requests (any status) for the Payment Review View All tab."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    payments = (
        PaymentRequest.objects.select_related(
            "account__customer__user",
            "approved_by",
        ).order_by("-date_paid")
    )

    data = []
    for p in payments:
        customer = p.account.customer
        data.append({
            "payment_id": p.payment_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "amount_paid": str(p.amount_paid),
            "date_paid": p.date_paid.strftime("%B %d, %Y"),
            "status": p.payment_status,
            "confirmed_by": p.approved_by.get_full_name() or p.approved_by.username if p.approved_by else None,
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_pending_payments(request):
    """List of PENDING payment requests for the Payment Review tab."""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    pending = (
        PaymentRequest.objects.filter(payment_status="PENDING")
        .select_related("account__customer__user")
        .order_by("-date_paid")
    )

    data = []
    for p in pending:
        customer = p.account.customer
        data.append({
            "payment_id": p.payment_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "amount_paid": str(p.amount_paid),
            "date_paid": p.date_paid.strftime("%B %d, %Y"),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cm_payment_detail(request, payment_id):
    """Get detailed payment information for review"""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        payment = PaymentRequest.objects.select_related(
            "account__customer__user",
            "account__customer__application"
        ).get(payment_id=payment_id)
    except PaymentRequest.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

    customer = payment.account.customer
    app = customer.application
    credit = payment.account

    return Response({
        "payment_id": payment.payment_id,
        "customer_name": customer.user.get_full_name() or customer.user.username,
        "phone": app.phone_number if app else "",
        "email": app.email if app else customer.user.email,
        "inv_number": payment.inv_number,
        "amount_paid": str(payment.amount_paid),
        "date_paid": payment.date_paid.strftime("%B %d, %Y"),
        "date_submitted": payment.timestamp.strftime("%B %d, %Y"),
        "proof_payment_url": request.build_absolute_uri(payment.proof_payment.url) if payment.proof_payment else None,
        "outstanding_balance": str(credit.outstanding_bal),
        "available_credit": str(credit.available_credit),
        "credit_limit": str(credit.credit_limit),
        "payment_status": payment.payment_status,
        "payment_type": payment.payment_type or "",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_approve_payment(request, payment_id):
    """Approve/verify a payment - reduce outstanding balance and increase available credit"""
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

    try:
        payment = PaymentRequest.objects.select_related("account").get(payment_id=payment_id)
    except PaymentRequest.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

    if payment.payment_status != "PENDING":
        return Response(
            {"error": "Only pending payments can be verified"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get credit account
    credit = payment.account
    
    # Convert to Decimal for safe arithmetic
    try:
        payment_amount = Decimal(str(payment.amount_paid))
        outstanding = Decimal(str(credit.outstanding_bal))
        available = Decimal(str(credit.available_credit))
        limit = Decimal(str(credit.credit_limit))
    except (InvalidOperation, ValueError) as e:
        return Response(
            {"error": f"Invalid amount in database: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Validate payment amount
    if payment_amount <= 0:
        return Response(
            {"error": "Payment amount must be greater than zero"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if payment exceeds outstanding balance
    if payment_amount > outstanding:
        return Response(
            {"error": f"Payment amount (₱{payment_amount}) exceeds outstanding balance (₱{outstanding})"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate new balances
    new_outstanding = outstanding - payment_amount
    new_available = available + payment_amount
    
    # Ensure new_available doesn't exceed credit limit
    if new_available > limit:
        new_available = limit

    with transaction.atomic():
        payment.payment_status = "VERIFIED"
        payment.approved_by = request.user
        payment.save()

        # Update credit account with new calculated values
        credit.outstanding_bal = new_outstanding
        credit.available_credit = new_available
        credit.save()

    # Create notification for customer
    Notification.objects.create(
        customer=payment.account.customer,
        sent_by=request.user,
        message=f"Your payment request (Payment ID: {payment.payment_id}) for ₱{payment.amount_paid:,.2f} has been verified and your credit balance has been updated.",
    )

    log_audit(user=request.user, action="APPROVE_PAYMENT", details={"payment_id": payment_id, "amount": str(payment.amount_paid)}, request=request)

    with new_context():
        identify_context(str(request.user.id))
        capture('payment_verified', properties={
            'amount_paid': float(payment_amount),
            'payment_type': payment.payment_type or '',
        })

    return Response({
        "success": True,
        "payment_id": payment.payment_id,
        "message": "Payment verified successfully",
        "new_outstanding_balance": str(new_outstanding),
        "new_available_credit": str(new_available),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cm_reject_payment(request, payment_id):
    """Reject a payment request"""
    if not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        payment = PaymentRequest.objects.get(payment_id=payment_id)
    except PaymentRequest.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

    if payment.payment_status != "PENDING":
        return Response(
            {"error": "Only pending payments can be rejected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rejection_reason = request.data.get("rejection_reason", "").strip()
    if not rejection_reason or len(rejection_reason.split()) < 5:
        return Response(
            {"error": "Please provide at least 5 words for the rejection reason."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payment.payment_status = "REJECTED"
    payment.approved_by = request.user
    payment.rejection_reason = rejection_reason
    payment.save()

    # Send rejection email to the customer
    from django.core.mail import send_mail
    customer = payment.account.customer
    customer_name = customer.user.get_full_name() or customer.user.username
    customer_email = customer.user.email
    if customer_email:
        send_mail(
            subject="Your Payment Request Has Been Rejected",
            message=(
                f"Dear {customer_name},\n\n"
                f"We regret to inform you that your payment request "
                f"(Payment ID: {payment.payment_id}) for ₱{payment.amount_paid} "
                f"has been rejected.\n\n"
                f"Reason for rejection:\n{rejection_reason}\n\n"
                f"If you have any questions, please contact our support team.\n\n"
                f"Regards,\nMylora Web Credit System"
            ),
            from_email="noreply@mylora.ph",
            recipient_list=[customer_email],
            fail_silently=True,
        )

    # Create notification for customer
    customer = payment.account.customer
    Notification.objects.create(
        customer=customer,
        sent_by=request.user,
        message=f"Your payment request (Payment ID: {payment.payment_id}) for ₱{payment.amount_paid:,.2f} has been rejected. Reason: {rejection_reason}",
    )

    log_audit(user=request.user, action="REJECT_PAYMENT", details={"payment_id": payment_id, "rejection_reason": rejection_reason}, request=request)

    with new_context():
        identify_context(str(request.user.id))
        capture('payment_rejected', properties={
            'amount_paid': float(payment.amount_paid),
            'payment_type': payment.payment_type or '',
        })

    return Response({
        "success": True,
        "payment_id": payment.payment_id,
        "message": "Payment rejected",
    })


# ─── Upper Management Payment Endpoints ──────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_pending_payments(request):
    """Pending payment requests for Upper Management dashboard."""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    pending = (
        PaymentRequest.objects.filter(payment_status="PENDING")
        .select_related("account__customer__user")
        .order_by("-date_paid")
    )

    data = []
    for p in pending:
        customer = p.account.customer
        data.append({
            "payment_id": p.payment_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "amount_paid": str(p.amount_paid),
            "date_paid": p.date_paid.strftime("%B %d, %Y"),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_all_payments(request):
    """All payment requests for Upper Management."""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    payments = (
        PaymentRequest.objects.select_related(
            "account__customer__user",
            "approved_by",
        ).order_by("-date_paid")
    )

    data = []
    for p in payments:
        customer = p.account.customer
        data.append({
            "payment_id": p.payment_id,
            "customer_name": customer.user.get_full_name() or customer.user.username,
            "amount_paid": str(p.amount_paid),
            "date_paid": p.date_paid.strftime("%B %d, %Y"),
            "status": p.payment_status,
            "confirmed_by": p.approved_by.get_full_name() or p.approved_by.username if p.approved_by else None,
        })

    return Response(data)