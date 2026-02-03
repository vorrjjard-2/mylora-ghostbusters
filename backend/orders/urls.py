from django.urls import path
from .views import create_order, customer_orders, order_detail

urlpatterns = [
    path('api/orders/create/', create_order),
    path('api/orders/', customer_orders),
    path('api/orders/<int:order_id>/', order_detail),
]