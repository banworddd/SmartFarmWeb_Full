from django.urls import path
from .views import UserFarmsAPIView

urlpatterns = [
    path('user_farms/', UserFarmsAPIView.as_view(), name='user_farms'),
]