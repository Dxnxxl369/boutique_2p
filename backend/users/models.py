from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with role-based access.
    Roles for internal staff: admin, vendedor, bodeguero, cajero
    Roles for customers: user (for mobile customers)
    """
    
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
        ('bodeguero', 'Bodeguero'),
        ('cajero', 'Cajero'),
        ('user', 'Cliente'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        help_text='Role determines access level'
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Phone number'
    )
    
    address = models.TextField(
        blank=True,
        null=True,
        help_text='Physical address'
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='Profile picture'
    )
    
    hired_date = models.DateField(
        blank=True,
        null=True,
        help_text='Date hired for staff members'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        """Check if user is an administrator"""
        return self.role == 'admin'
    
    @property
    def is_customer(self):
        """Check if user is a customer"""
        return self.role == 'user'
    
    @property
    def is_staff_member(self):
        """Check if user is internal staff"""
        return self.role in ['admin', 'vendedor', 'bodeguero', 'cajero']

