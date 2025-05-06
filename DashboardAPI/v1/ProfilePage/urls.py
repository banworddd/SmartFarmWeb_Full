from django.urls import path

from .views import CustomUserProfileAPIView, CustomUserChangePasswordAPIView

urlpatterns = [
    path('user_data/', CustomUserProfileAPIView.as_view(), name='user_data'),
    path('user_change_password/', CustomUserChangePasswordAPIView.as_view(), name='user_change_password' ),
]