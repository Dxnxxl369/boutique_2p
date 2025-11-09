import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.accept()

        # Join a group for admins/staff or a personal group for customers
        if self.user.is_staff_member:
            await self.channel_layer.group_add(
                "admin_orders",
                self.channel_name
            )
        else:
            await self.channel_layer.group_add(
                f"user_{self.user.id}_orders",
                self.channel_name
            )

    async def disconnect(self, close_code):
        if not self.user.is_authenticated:
            return

        if self.user.is_staff_member:
            await self.channel_layer.group_discard(
                "admin_orders",
                self.channel_name
            )
        else:
            await self.channel_layer.group_discard(
                f"user_{self.user.id}_orders",
                self.channel_name
            )

    # This method is called when a message is sent to the group
    async def order_notification(self, event):
        message = event['message']
        notification_type = event['type']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': notification_type,
            'message': message
        }))
