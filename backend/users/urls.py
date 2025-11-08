from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import UserViewSet, CustomTokenObtainPairView, RegisterView, current_user, logout

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    # User management endpoints
    path('users/', include(router.urls)),
    # Authentication endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('me/', current_user, name='current_user'),
    path('logout/', logout, name='logout'),
]
