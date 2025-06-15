from django.urls import path

from .views import (
    FarmAPIView, 
    FarmMembershipsAPIView, 
    FarmOrganizationAPIView, 
    FarmMembershipUpdateAPIView,
    FarmMembershipCreateAPIView,
    AvailableFarmUsersAPIView,
    FarmZonesAPIView,
    ZoneUpdateAPIView,
    ZoneCreateAPIView
)

urlpatterns = [
    path('main_data/', FarmAPIView.as_view(), name='farm_main_data'),
    path('ext_org/', FarmOrganizationAPIView.as_view(), name='farm_ext_org'),
    path('users/', FarmMembershipsAPIView.as_view(), name='farm_users'),
    path('update_user/', FarmMembershipUpdateAPIView.as_view(), name='farm_update_user'),
    path('add_user/', FarmMembershipCreateAPIView.as_view(), name='farm_add_user'),
    path('available_users/', AvailableFarmUsersAPIView.as_view(), name='farm_available_users'),
    path('zones/', FarmZonesAPIView.as_view(), name='farm_zones'),
    path('zone/<int:pk>/', ZoneUpdateAPIView.as_view(), name='farm_zone_update'),
    path('zone/create/', ZoneCreateAPIView.as_view(), name='farm_zone_create'),
]