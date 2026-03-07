from django.urls import path
from .views import (
    cm_all_payments,
    cm_pending_payments,
    submit_payment,
    cm_payment_detail,
    cm_approve_payment,
    cm_reject_payment,
)

urlpatterns = [
    path("api/payments/submit/", submit_payment),
    path("api/cm/all-payments/", cm_all_payments),
    path("api/cm/pending-payments/", cm_pending_payments),
    path("api/cm/payment/<int:payment_id>/", cm_payment_detail),
    path("api/cm/payment/<int:payment_id>/approve/", cm_approve_payment),
    path("api/cm/payment/<int:payment_id>/reject/", cm_reject_payment),
]