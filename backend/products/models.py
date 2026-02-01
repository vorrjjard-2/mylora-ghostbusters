from django.db import models

class Product(models.Model):
    """Product catalog"""
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, help_text="e.g., kg, pcs, box")
    
    def __str__(self):
        return f"{self.name} ({self.unit})"