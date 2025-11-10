from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the notifications
        for the currently authenticated user.
        """
        return self.request.user.notifications.all().order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Mark all unread notifications for the user as read.
        """
        updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response(
            {'message': f'{updated_count} notifications marked as read.'},
            status=status.HTTP_200_OK
        )