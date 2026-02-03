from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import PaymentRequest


def _require_role(request, role_name):
    return request.user.groups.filter(name=role_name).exists()


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