from django.contrib import admin
from .models import (
    Customer, Branch, CreditAccount, AuditLog,
    UserProfile, Notification, ReminderMessage, CreditIncreaseRequest,
)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'application']
    search_fields = ['user__username', 'user__email']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['branch_id', 'name', 'address']
    search_fields = ['name']


@admin.register(CreditAccount)
class CreditAccountAdmin(admin.ModelAdmin):
    list_display = ['account_id', 'customer', 'credit_limit', 'available_credit', 'outstanding_bal', 'status']
    list_filter = ['status', 'branch']
    search_fields = ['customer__user__username']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['log_id', 'user', 'action', 'timestamp', 'ip_address']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'action']
    readonly_fields = ['log_id', 'user', 'action', 'timestamp', 'details', 'ip_address']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'must_change_password']
    search_fields = ['user__username', 'user__email']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['notification_id', 'customer', 'sent_by', 'is_read', 'created_at']
    list_filter = ['is_read', 'requires_acknowledgment', 'created_at']
    search_fields = ['customer__user__username', 'message']


@admin.register(ReminderMessage)
class ReminderMessageAdmin(admin.ModelAdmin):
    list_display = ['message_id', 'slot', 'updated_at', 'updated_by']
    list_filter = ['slot']


@admin.register(CreditIncreaseRequest)
class CreditIncreaseRequestAdmin(admin.ModelAdmin):
    list_display = ['request_id', 'account', 'requested_limit', 'requested_term', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['account__customer__user__username']