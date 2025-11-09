from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order

@receiver(post_save, sender=Order)
def order_created_or_updated(sender, instance, created, **kwargs):
    """
    Sends a notification when an order is created or updated.
    """
    channel_layer = get_channel_layer()
    
    if created:
        # Notify admins of a new order
        message = {
            'type': 'order.notification',
            'message': {
                'notification_type': 'new_order',
                'order_id': instance.id,
                'order_number': instance.number,
                'customer_name': instance.customer_name,
                'total_amount': str(instance.total_amount),
            }
        }
        async_to_sync(channel_layer.group_send)("admin_orders", message)
    else:
        # Notify the specific customer of a status update
        if instance.created_by:
            message = {
                'type': 'order.notification',
                'message': {
                    'notification_type': 'status_update',
                    'order_id': instance.id,
                    'order_number': instance.number,
                    'new_status': instance.status,
                }
            }
            user_group_name = f"user_{instance.created_by.id}_orders"
            async_to_sync(channel_layer.group_send)(user_group_name, message)
