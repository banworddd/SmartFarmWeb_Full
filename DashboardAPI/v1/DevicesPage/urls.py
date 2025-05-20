from django.urls import path

from .views import OrgFarmsListView, OrgFarmZonesListView, FarmZonesDevicesAPIView, DeviceModelsAPIView, \
    AddDeviceAPIView, AddDeviceLocationAPIView, UpdateDeviceAPIView, UpdateDeviceLocationAPIView, DeviceInfoAPIView

urlpatterns = [
    path('org_farms/', OrgFarmsListView.as_view(), name='ext_org_farms'),
    path('org_farms_zones/', OrgFarmZonesListView.as_view(), name='ext_org_zones'),
    path('zones_devices/', FarmZonesDevicesAPIView.as_view(), name='devices_zones'),
    path('device/<int:pk>/', DeviceInfoAPIView.as_view(), name='device_info'),
    path('device_models/', DeviceModelsAPIView.as_view(), name='device_models'),
    path('add_device/', AddDeviceAPIView.as_view(), name='add_device'),
    path('add_device_location/', AddDeviceLocationAPIView.as_view(), name='add_device_location'),
    path('update_device/<int:pk>/', UpdateDeviceAPIView.as_view(), name='update_device'),
    path('update_device_location/<int:pk>/', UpdateDeviceLocationAPIView.as_view(), name='update_device_location'),

]