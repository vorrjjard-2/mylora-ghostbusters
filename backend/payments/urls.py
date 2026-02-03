from django.urls import path
from .views import cm_pending_payments

urlpatterns = [
    path("api/cm/pending-payments/", cm_pending_payments),
]