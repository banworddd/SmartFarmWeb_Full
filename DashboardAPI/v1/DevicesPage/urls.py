from django.urls import path

from .views import OrgFarmsListView, OrgFarmZonesListView, FarmZonesDevicesAPIView

urlpatterns = [
    path('org_farms/', OrgFarmsListView.as_view(), name='sim_ext_models'),
    path('org_farms_zones/', OrgFarmZonesListView.as_view(), name='sim_ext_zones'),
    path('zones_devices/', FarmZonesDevicesAPIView.as_view(), name='devices_zones'),

]