from django.contrib import admin

from django.contrib import admin
from .models import Customer, Branch, CreditAccount, AuditLog


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