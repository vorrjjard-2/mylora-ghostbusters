from django.db import models
from django.conf import settings


class Customer(models.Model):
    """Extended user profile for customers"""
    # Django automatically creates 'id' as primary key - we'll use that
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_profile'
    )
    # Link to their approved enrollment application
    application = models.OneToOneField(
        'applications.CreditEnrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer'
    )
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.user.email})"


class Branch(models.Model):
    """Store branches"""
    branch_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    address = models.TextField()
    
    class Meta:
        verbose_name_plural = "branches"
    
    def __str__(self):
        return self.name


class CreditAccount(models.Model):
    """Customer credit account with limits and balances"""
    account_id = models.AutoField(primary_key=True)
    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        related_name='credit_account'
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        related_name='credit_accounts'
    )
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2)
    available_credit = models.DecimalField(max_digits=12, decimal_places=2)
    outstanding_bal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    credit_term = models.IntegerField(help_text="Credit term in days")
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('SUSPENDED', 'Suspended'),
            ('CLOSED', 'Closed')
        ],
        default='ACTIVE'
    )
    
    def __str__(self):
        return f"Account {self.account_id} - {self.customer}"


class AuditLog(models.Model):
    """Audit trail for all user actions"""
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_audit(user, action, details=None, request=None):
    ip_address = get_client_ip(request) if request else None
    AuditLog.objects.create(
        user=user,
        action=action,
        details=details,
        ip_address=ip_address,
    )