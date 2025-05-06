from django.urls import path

from .serializers import CustomUserChangePasswordSerializer
from .views import UserFarmsAPIView, UserExternalOrganizationsAPIView, ExternalOrganizationAPIView, \
    ExternalOrganizationUsersAPIVIew, ExternalOrganizationMembershipAPIView, CustomUserProfileAPIView, \
    CustomUserChangePasswordAPIView, ExternalOrganizationFarmsAPIView

urlpatterns = [
    path('user_farms/', UserFarmsAPIView.as_view(), name='user_farms'),
    path('user_organizations/', UserExternalOrganizationsAPIView.as_view(), name='user_organizations' ),
    path('external_organization/', ExternalOrganizationAPIView.as_view(), name='external_organization'),
    path('external_organization_users/', ExternalOrganizationUsersAPIVIew.as_view(), name='external_organization_users' ),
    path('external_organization_user/', ExternalOrganizationMembershipAPIView.as_view(), name='external_organization_user' ),
    path('external_organization_farms/', ExternalOrganizationFarmsAPIView.as_view(), name='external_organization_farms'),
    path('custom_user_profile/', CustomUserProfileAPIView.as_view(), name='custom_user_profile'),
    path('custom_user_change_password/', CustomUserChangePasswordAPIView.as_view(), name='custom_user_change_password'),
]