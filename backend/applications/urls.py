from django.urls import path

from .views import (
    create_application, 
    pending_enrollments, 
    enrollment_detail, 
    approve_enrollment, 
    reject_enrollment,
    verify_activation_token,
    activate_account
)


urlpatterns = [
    path("api/applications/", create_application),
    path("api/enrollments/pending/", pending_enrollments),
    path("api/enrollments/<uuid:application_id>/", enrollment_detail),
    path("api/enrollments/<uuid:application_id>/approve/", approve_enrollment),
    path("api/enrollments/<uuid:application_id>/reject/", reject_enrollment),
    path("api/activate/verify/<str:token>/", verify_activation_token),
    path("api/activate/<str:token>/", activate_account),
]