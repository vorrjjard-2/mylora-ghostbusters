from django.db import models
from django.conf import settings


class PaymentRequest(models.Model):
    """Payment tracking for credit accounts"""
    payment_id = models.AutoField(primary_key=True)
    account = models.ForeignKey(
        'accounts.CreditAccount',
        on_delete=models.PROTECT,
        related_name='payment_requests'
    )
    inv_number = models.CharField(max_length=100, blank=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    date_paid = models.DateField()
    proof_payment = models.FileField(
        upload_to='payment_proofs/',
        null=True,
        blank=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_payments'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending Verification'),
            ('VERIFIED', 'Verified'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING'
    )
    rejection_reason = models.TextField(blank=True)
    payment_type = models.CharField(
        max_length=30,
        choices=[
            ('BANK_DEPOSIT', 'Bank Deposit'),
            ('PALAWAN', 'Palawan Remittance'),
            ('BRANCH_CASH', 'Branch Cash Payment'),
            ('BRANCH_CHECK', 'Branch Check Payment'),
        ],
        blank=True,
        default='',
    )

    def __str__(self):
        return f"Payment {self.payment_id} - ₱{self.amount_paid}"