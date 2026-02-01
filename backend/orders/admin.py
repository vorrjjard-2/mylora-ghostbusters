from django.contrib import admin
from .models import Order, OrderItem, OrderApproval, OrderCompletion, OverrideRequest


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'account', 'total_amount', 'order_status', 'date_ordered']
    list_filter = ['order_status', 'delivery_mode']
    search_fields = ['order_id', 'account__customer__user__username']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['item_id', 'order', 'product', 'quantity', 'unit_price']
    search_fields = ['order__order_id', 'product__name']


@admin.register(OrderApproval)
class OrderApprovalAdmin(admin.ModelAdmin):
    list_display = ['approval_id', 'order', 'user', 'approval_status', 'auto_approved', 'approval_date']
    list_filter = ['approval_status', 'auto_approved']
    search_fields = ['order__order_id', 'user__username']


@admin.register(OrderCompletion)
class OrderCompletionAdmin(admin.ModelAdmin):
    list_display = ['completion_id', 'order', 'user', 'completion_status', 'completion_date']
    list_filter = ['completion_status']
    search_fields = ['order__order_id']


@admin.register(OverrideRequest)
class OverrideRequestAdmin(admin.ModelAdmin):
    list_display = ['override_id', 'order', 'requesting_user', 'approving_user', 'override_status', 'override_date']
    list_filter = ['override_status']
    search_fields = ['order__order_id', 'requesting_user__username']