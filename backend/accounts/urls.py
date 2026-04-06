from django.urls import path
from .views import (
    login_view,
    me_view,
    logout_view,
    signup_view,
    customer_dashboard,
    customer_profile,
    change_password,
    force_set_password,
    update_address,
    um_employees_list,
    um_employee_detail,
    um_create_employee,
    um_update_employee,
    um_delete_employee,
    branches_list,
    um_audit_logs,
    send_reminder,
    customer_unread_notifications,
    acknowledge_notification,
    customer_notification_history,
    mark_notifications_read,
    get_reminder_messages,
    update_reminder_messages,
    customer_submit_credit_increase,
    um_credit_increase_list,
    um_credit_increase_detail,
    um_approve_credit_increase,
    um_reject_credit_increase,
)

urlpatterns = [
    path('api/login/', login_view),
    path('api/me/', me_view),
    path("api/logout/", logout_view),
    path("api/signup/", signup_view),
    path("api/customer/dashboard/", customer_dashboard),
    path("api/customer/profile/", customer_profile),
    path("api/customer/change-password/", change_password),
    path("api/force-set-password/", force_set_password),
    path("api/customer/update-address/", update_address),

    # Employee management endpoints
    path("api/um/employees/", um_employees_list),
    path("api/um/employee/<int:user_id>/", um_employee_detail),
    path("api/um/employee/create/", um_create_employee),
    path("api/um/employee/<int:user_id>/update/", um_update_employee),
    path("api/um/employee/<int:user_id>/delete/", um_delete_employee),
    path("api/branches/", branches_list),
    path("api/um/audit-logs/", um_audit_logs),

    # Notification endpoints
    path("api/customer/<int:customer_id>/send-reminder/", send_reminder),
    path("api/customer/notifications/unread/", customer_unread_notifications),
    path("api/customer/notifications/<int:notification_id>/acknowledge/", acknowledge_notification),
    path("api/customer/notifications/history/", customer_notification_history),
    path("api/customer/notifications/mark-read/", mark_notifications_read),

    # Reminder messages
    path("api/um/reminder-messages/", get_reminder_messages),
    path("api/um/reminder-messages/update/", update_reminder_messages),

    # Credit Increase Requests
    path("api/customer/credit-increase/", customer_submit_credit_increase),
    path("api/um/credit-increases/", um_credit_increase_list),
    path("api/um/credit-increase/<int:request_id>/", um_credit_increase_detail),
    path("api/um/credit-increase/<int:request_id>/approve/", um_approve_credit_increase),
    path("api/um/credit-increase/<int:request_id>/reject/", um_reject_credit_increase),
]
