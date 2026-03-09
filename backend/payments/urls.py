from django.urls import path
from .views import (
    cm_all_payments,
    cm_pending_payments,
    submit_payment,
    cm_payment_detail,
    cm_approve_payment,
    cm_reject_payment,
    customer_payment_history,
    um_pending_payments,
    um_all_payments,
)

urlpatterns = [
    path("api/payments/submit/", submit_payment),
    path("api/payments/history/", customer_payment_history),
    path("api/cm/all-payments/", cm_all_payments),
    path("api/cm/pending-payments/", cm_pending_payments),
    path("api/cm/payment/<int:payment_id>/", cm_payment_detail),
    path("api/cm/payment/<int:payment_id>/approve/", cm_approve_payment),
    path("api/cm/payment/<int:payment_id>/reject/", cm_reject_payment),
    path("api/um/pending-payments/", um_pending_payments),
    path("api/um/all-payments/", um_all_payments),
]