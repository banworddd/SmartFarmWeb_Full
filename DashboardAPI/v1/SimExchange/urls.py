from django.urls import path

from .views import DevicesModelsAPIView, DevicesAPIView, SensorDataSend, DeviceStatusSend, ActuatorDataSend

urlpatterns = [
    path('models/', DevicesModelsAPIView.as_view(), name='sim_ext_models'),
    path('devices/', DevicesAPIView.as_view(), name='sim_ext_devices'),
    path('sensor_data', SensorDataSend.as_view(), name="sim_ext_devices_data"),
    path('device_status', DeviceStatusSend.as_view(), name="sim_ext_device_status"),
    path('actuator_data', ActuatorDataSend.as_view(), name="sim_ext_actuator_data"),

]