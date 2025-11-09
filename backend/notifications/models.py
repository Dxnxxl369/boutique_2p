from django.db import models
from django.conf import settings

class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Recipient'
    )
    message = models.TextField(verbose_name='Message')
    notification_type = models.CharField(
        max_length=50,
        verbose_name='Notification Type',
        help_text='e.g., new_order, order_status_update'
    )
    is_read = models.BooleanField(default=False, verbose_name='Is Read')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"Notification for {self.recipient.email} - {self.notification_type}"