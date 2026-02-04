from django.urls import path
from .views import (
    create_order, 
    customer_orders, 
    order_detail,
    cm_pending_orders,
    cm_order_detail,
    cm_approve_order,
    cm_reject_order,
    cm_request_override,
)

urlpatterns = [
    path('api/orders/create/', create_order),
    path('api/orders/', customer_orders),
    path('api/orders/<int:order_id>/', order_detail),
    
    # Credit Manager endpoints
    path('api/cm/pending-orders/', cm_pending_orders),
    path('api/cm/order/<int:order_id>/', cm_order_detail),
    path('api/cm/order/<int:order_id>/approve/', cm_approve_order),
    path('api/cm/order/<int:order_id>/reject/', cm_reject_order),
    path('api/cm/order/<int:order_id>/request-override/', cm_request_override),
]