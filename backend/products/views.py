from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Product


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def product_list(request):
    """Get all available products"""
    products = Product.objects.all().order_by('name')
    
    data = []
    for product in products:
        data.append({
            'product_id': product.product_id,
            'name': product.name,
            'unit_price': str(product.unit_price),
            'unit': product.unit
        })
    
    return Response(data)