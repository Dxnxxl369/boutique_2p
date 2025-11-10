from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from orders.models import Order
from .models import Notification
from users.models import User # Assuming users.models.User is the AUTH_USER_MODEL
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    # Notification for Admin on New Order
    if created:
        # Get all staff/superuser users (admins)
        # Assuming 'is_staff' or 'is_superuser' identifies an admin
        admin_users = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admin_users.distinct():
            Notification.objects.create(
                recipient=admin,
                message=f"New Order #{instance.number} placed by {instance.customer_name}.",
                notification_type="new_order"
            )
    # Notification for Client on Order Status Update to 'completed'
    # Check if the status has actually changed to 'completed'
    # To avoid sending multiple notifications if the order is saved again without status change
    # For simplicity, we'll send it if the current status is 'completed'.
    # A more robust solution would involve pre_save or custom logic to track changes.
    elif instance.status == Order.Status.SHIPPED:
        if instance.created_by: # Ensure there's a user associated with the order
            notification_message = f"Your Order #{instance.number} has been shipped and is on its way!"
            Notification.objects.create(
                recipient=instance.created_by,
                message=notification_message,
                notification_type="order_status_update"
            )
            
            # Send FCM push notification if the user has an FCM token
            if instance.created_by.fcm_token:
                try:
                    from firebase_admin import messaging
                    message = messaging.Message(
                        notification=messaging.Notification(
                            title="Your Order is on its way!",
                            body=notification_message,
                        ),
                        data={
                            "order_id": str(instance.id),
                            "order_number": instance.number,
                            "notification_type": "order_status_update",
                        },
                        token=instance.created_by.fcm_token,
                    )
                    response = messaging.send(message)
                    print(f"Successfully sent FCM message: {response}")
                except Exception as e:
                    print(f"Error sending FCM message: {e}")

@receiver(post_save, sender=Notification)
def send_realtime_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        user_id = str(instance.recipient.id)
        user_group_name = f'user_{user_id}'

        notification_data = {
            'type': 'send_notification', # This calls the send_notification method in the consumer
            'message': instance.message,
            'notification_type': instance.notification_type,
            'is_read': instance.is_read,
            'created_at': instance.created_at.isoformat(), # ISO format for easy parsing in JS/Dart
            'notification_id': instance.id,
        }

        async_to_sync(channel_layer.group_send)(
            user_group_name,
            notification_data
        )
