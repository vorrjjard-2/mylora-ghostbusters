from django.db import models


class Product(models.Model):
    """Product catalog - branch specific pricing"""
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, help_text="e.g., kg, pcs, box")
    branch = models.ForeignKey(
        'accounts.Branch',
        on_delete=models.CASCADE,
        related_name='products',
        null=True,
        blank=True,
    )

    def __str__(self):
        branch_name = self.branch.name if self.branch else "No Branch"
        return f"{self.name} ({self.unit}) - {branch_name}"