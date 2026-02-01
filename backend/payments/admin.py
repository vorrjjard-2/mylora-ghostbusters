from django.contrib import admin
from .models import PaymentRequest


@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'account', 'amount_paid', 'date_paid', 'payment_status', 'approved_by']
    list_filter = ['payment_status', 'date_paid']
    search_fields = ['account__customer__user__username', 'inv_number']