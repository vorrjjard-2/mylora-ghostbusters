from django.urls import path
from .views import (
    product_list,
    um_products_list,
    um_branches_list,
    um_product_create,
    um_product_detail,
    um_product_update,
    um_product_delete,
)

urlpatterns = [
    path('api/products/', product_list),

    # Upper Management product endpoints
    path('api/um/products/', um_products_list),
    path('api/um/branches/', um_branches_list),
    path('api/um/product/create/', um_product_create),
    path('api/um/product/<int:product_id>/', um_product_detail),
    path('api/um/product/<int:product_id>/update/', um_product_update),
    path('api/um/product/<int:product_id>/delete/', um_product_delete),
]
