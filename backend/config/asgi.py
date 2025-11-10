import os
from django.core.asgi import get_asgi_application

# Set the settings module environment variable.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize the Django ASGI application early to ensure the settings are configured.
django_asgi_app = get_asgi_application()

# Now, import the rest of the Channels and project-specific components
from channels.routing import ProtocolTypeRouter, URLRouter
import orders.routing
import notifications.routing
from config.middleware import TokenAuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(
            orders.routing.websocket_urlpatterns +
            notifications.routing.websocket_urlpatterns
        )
    ),
})