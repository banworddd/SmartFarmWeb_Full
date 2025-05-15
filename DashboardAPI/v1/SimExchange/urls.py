from django.urls import path

from .views import DevicesModelsAPIView, DevicesAPIView, SensorDataSend, DeviceStatusSend

urlpatterns = [
    path('models/', DevicesModelsAPIView.as_view(), name='sim_ext_models'),
    path('devices/', DevicesAPIView.as_view(), name='sim_ext_devices'),
    path('devices_data', SensorDataSend.as_view(), name="sim_ext_devices_data"),
    path('device_status', DeviceStatusSend.as_view(), name="sim_ext_device_status"),
]