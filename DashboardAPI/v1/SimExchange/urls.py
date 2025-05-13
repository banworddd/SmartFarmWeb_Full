from django.urls import path

from .views import DevicesModelsAPIView, DevicesAPIView

urlpatterns = [
    path('models/', DevicesModelsAPIView.as_view(), name='sim_ext_models'),
    path('devices/', DevicesAPIView.as_view(), name='sim_ext_devices'),
]