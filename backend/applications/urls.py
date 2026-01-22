from django.urls import path
from .views import create_application

urlpatterns = [
    path("api/applications/", create_application),
]
