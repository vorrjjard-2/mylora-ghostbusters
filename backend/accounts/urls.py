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
    um_employees_list,
    um_employee_detail,
    um_create_employee,
    um_update_employee,
    um_delete_employee,
    branches_list,
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
    
    # Employee management endpoints
    path("api/um/employees/", um_employees_list),
    path("api/um/employee/<int:user_id>/", um_employee_detail),
    path("api/um/employee/create/", um_create_employee),
    path("api/um/employee/<int:user_id>/update/", um_update_employee),
    path("api/um/employee/<int:user_id>/delete/", um_delete_employee),
    path("api/branches/", branches_list),
]