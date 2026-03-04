from django.db import models

from django.db import models
from django.conf import settings


class Order(models.Model):
    """Purchase orders"""
    ORDER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
    ]
    
    order_id = models.AutoField(primary_key=True)
    account = models.ForeignKey(
        'accounts.CreditAccount',
        on_delete=models.CASCADE,
        related_name='orders'
    )
    branch = models.ForeignKey(
        'accounts.Branch',
        on_delete=models.PROTECT,
        related_name='orders'
    )
    delivery_mode = models.CharField(
        max_length=50,
        choices=[
            ('PICKUP', 'Pickup'),
            ('DELIVERY', 'Delivery')
        ],
        default='DELIVERY'
    )
    date_ordered = models.DateTimeField(auto_now_add=True)
    shipping_address = models.TextField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    order_status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default='PENDING'
    )
    
    class Meta:
        ordering = ['-date_ordered']
    
    def __str__(self):
        return f"Order {self.order_id} - {self.account.customer}"


class OrderItem(models.Model):
    """Items in an order"""
    item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    @property
    def subtotal(self):
        return self.quantity * self.unit_price


class OrderApproval(models.Model):
    """Order approval workflow"""
    approval_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='order_approvals'
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='approvals'
    )
    auto_approved = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING'
    )
    approval_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Approval for Order {self.order.order_id} - {self.approval_status}"


class OrderCompletion(models.Model):
    """Track order completion and delivery"""
    completion_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='order_completions'
    )
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='completion'
    )
    completion_status = models.CharField(
        max_length=20,
        choices=[
            ('PREPARING', 'Preparing'),
            ('READY', 'Ready for Pickup/Delivery'),
            ('IN_TRANSIT', 'In Transit'),
            ('DELIVERED', 'Delivered'),
            ('CANCELLED', 'Cancelled')
        ],
        default='PREPARING'
    )
    completion_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Completion for Order {self.order.order_id}"


class OverrideRequest(models.Model):
    """Credit limit override requests"""
    override_id = models.AutoField(primary_key=True)
    requesting_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='override_requests_made'
    )
    approving_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='override_requests_approved',
        null=True,
        blank=True
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='override_requests'
    )
    override_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING'
    )
    override_date = models.DateTimeField(null=True, blank=True)
    reason = models.TextField()
    
    def __str__(self):
        return f"Override Request for Order {self.order.order_id}"