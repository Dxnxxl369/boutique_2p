import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            # Reject anonymous users
            await self.close()
        else:
            self.user_id = str(self.scope["user"].id)
            self.user_group_name = f'user_{self.user_id}'

            # Join user group
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if not self.scope["user"].is_anonymous:
            # Leave user group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        # We don't expect clients to send messages to the notification consumer
        # But if they do, we can log it or ignore it.
        pass

    # Receive notification from channel layer
    async def send_notification(self, event):
        message = event['message']
        notification_type = event['notification_type']
        is_read = event['is_read']
        created_at = event['created_at']
        notification_id = event['notification_id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': notification_id,
            'message': message,
            'notification_type': notification_type,
            'is_read': is_read,
            'created_at': created_at,
        }))
