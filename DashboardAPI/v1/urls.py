from django.urls import path
from .views import UserFarmsAPIView, UserExternalOrganizationsAPIView, ExternalOrganizationAPIView

urlpatterns = [
    path('user_farms/', UserFarmsAPIView.as_view(), name='user_farms'),
    path('user_organizations/', UserExternalOrganizationsAPIView.as_view(), name='user_organizations' ),
    path('external_organization/', ExternalOrganizationAPIView.as_view(), name='external_organization'),
]