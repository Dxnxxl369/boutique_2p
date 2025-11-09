from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model

User = get_user_model()

class TokenAuthMiddleware:
    """
    Custom middleware that takes a token from the query string and authenticates the user.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()
        query_string = parse_qs(scope["query_string"].decode("utf8"))
        token = query_string.get("token")
        if token:
            try:
                access_token = AccessToken(token[0])
                user = await User.objects.aget(id=access_token["user_id"])
                scope["user"] = user
            except Exception as e:
                print(f"WebSocket authentication failed: {e}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(AuthMiddlewareStack(inner))
