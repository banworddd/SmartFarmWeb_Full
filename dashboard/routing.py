# dashboard/routing.py
from django.urls import re_path
from . import consumers     

websocket_urlpatterns = [
    re_path(r'ws/sensor/(?P<device_id>\d+)/$', consumers.SensorDataConsumer.as_asgi()),
]
