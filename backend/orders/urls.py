from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    path('orders/reports-pdf/', OrderViewSet.as_view({'get': 'reports_pdf'}), name='order-reports-pdf'),
    path('orders/reports-excel/', OrderViewSet.as_view({'get': 'reports_excel'}), name='order-reports-excel'),
    path('orders/voice-command/', OrderViewSet.as_view({'post': 'voice_command'}), name='order-voice-command'),
] + router.urls
