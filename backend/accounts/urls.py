from django.urls import path
from .views import (
    login_view, 
    me_view, 
    logout_view, 
    signup_view, 
    customer_dashboard,
    customer_profile,
    change_password,
    update_address,
)

urlpatterns = [
    path('api/login/', login_view),
    path('api/me/', me_view),
    path("api/logout/", logout_view),
    path("api/signup/", signup_view),
    path("api/customer/dashboard/", customer_dashboard),
    path("api/customer/profile/", customer_profile),
    path("api/customer/change-password/", change_password),
    path("api/customer/update-address/", update_address),
]