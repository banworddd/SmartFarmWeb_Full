from django.urls import path

from .views import OrgFarmsListView, OrgFarmZonesListView, FarmZonesDevicesAPIView, DeviceModelsAPIView

urlpatterns = [
    path('org_farms/', OrgFarmsListView.as_view(), name='ext_org_farms'),
    path('org_farms_zones/', OrgFarmZonesListView.as_view(), name='ext_org_zones'),
    path('zones_devices/', FarmZonesDevicesAPIView.as_view(), name='devices_zones'),
    path('device_models/', DeviceModelsAPIView.as_view(), name='device_models'),
    path('add_device/', DeviceModelsAPIView.as_view(), name='add_device'),

]