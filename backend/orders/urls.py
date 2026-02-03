from django.urls import path
from .views import create_order, customer_orders

urlpatterns = [
    path('api/orders/create/', create_order),
    path('api/orders/', customer_orders),
]