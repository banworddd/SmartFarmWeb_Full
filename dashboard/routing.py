from django.urls import path, re_path
from . import consumers

websocket_urlpatterns = [
    path("ws/test/", consumers.EchoConsumer.as_asgi()),
    re_path(r'ws/sensor-data/(?P<device_id>\w+)/$', consumers.SensorDataConsumer.as_asgi()),
]