from django.urls import path

from .views import ExternalOrganizationAPIView, ExternalOrganizationUsersAPIVIew, ExternalOrganizationMembershipAPIView, \
    ExternalOrganizationFarmsAPIView

urlpatterns = [
    path('main_data/', ExternalOrganizationAPIView.as_view(), name='main_data'),
    path('users/', ExternalOrganizationUsersAPIVIew.as_view(), name='ext_org_users' ),
    path('user/', ExternalOrganizationMembershipAPIView.as_view(), name='ext_org_user' ),
    path('farms/', ExternalOrganizationFarmsAPIView.as_view(), name='external_organization_farms'),
]