from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, InventoryMovementViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'inventory-movements', InventoryMovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
