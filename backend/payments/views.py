from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
from datetime import datetime
from django.db import transaction

from .models import PaymentRequest
from accounts.models import Customer, log_audit


def _require_role(request, role_name):
    return request.user.groups.filter(name=role_name).exists()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_payment(request):
    """Customer submits a payment request"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        # Extract payment data
        inv_number = request.data.get("inv_number", "")
        amount_paid = request.data.get("amount_paid")
        date_paid = request.data.get("date_paid")
        proof_payment = request.FILES.get("proof_payment")
        
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
        
        # Create payment request
        payment = PaymentRequest.objects.create(
            account=credit_account,
            inv_number=inv_number,
            amount_paid=amount_decimal,
            date_paid=date_obj,
            proof_payment=proof_payment,
            payment_status="PENDING"
        )
        
        return Response({
            "success": True,
            "payment_id": payment.payment_id,
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

    log_audit(user=request.user, action="APPROVE_PAYMENT", details={"payment_id": payment_id, "amount": str(payment.amount_paid)}, request=request)
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

    payment.payment_status = "REJECTED"
    payment.approved_by = request.user
    payment.save()

    log_audit(user=request.user, action="REJECT_PAYMENT", details={"payment_id": payment_id}, request=request)
    return Response({
        "success": True,
        "payment_id": payment.payment_id,
        "message": "Payment rejected",
    })