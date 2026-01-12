from django.urls import path
from .views import login_view, me_view

urlpatterns = [
    path('api/login/', login_view),
    path('api/me/', me_view),
]
