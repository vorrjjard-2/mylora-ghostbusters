from django.urls import path
from .views import login_view, me_view, logout_view, signup_view, customer_dashboard

urlpatterns = [
    path('api/login/', login_view),
    path('api/me/', me_view),
    path("api/logout/", logout_view),
    path("api/signup/", signup_view),
    path("api/customer/dashboard/", customer_dashboard),
]