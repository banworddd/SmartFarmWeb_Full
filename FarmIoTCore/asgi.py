import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import dashboard.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FarmIoTCore.settings')
django.setup()

application = ProtocolTypeRouter({
    # HTTP запросы будут обрабатываться как обычно
    "http": get_asgi_application(),

    # WebSocket запросы — через Channels
    "websocket": AuthMiddlewareStack(
        URLRouter(
            dashboard.routing.websocket_urlpatterns
        )
    ),
})
