import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack # Remove default AuthMiddlewareStack
import orders.routing
import notifications.routing # Import notifications routing
from config.middleware import TokenAuthMiddlewareStack # Import custom TokenAuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddlewareStack( # Use custom TokenAuthMiddlewareStack
        URLRouter(
            orders.routing.websocket_urlpatterns + # Combine with existing patterns
            notifications.routing.websocket_urlpatterns
        )
    ),
})