from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from products.models import Product


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Efectivo"
        CARD = "card", "Tarjeta"
        TRANSFER = "transfer", "Transferencia"
        NEQUI = "nequi", "Nequi"
        DAVIPLATA = "daviplata", "Daviplata"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        COMPLETED = "completed", "Completada"
        CANCELLED = "cancelled", "Cancelada"

    number = models.CharField(max_length=20, unique=True, editable=False)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=30)
    customer_address = models.TextField(blank=True, null=True)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
    )
    notes = models.TextField(blank=True, null=True)

    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["payment_method"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Orden {self.number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.number:
            today = timezone.localdate()
            prefix = today.strftime("%Y%m%d")
            sequence = Order.objects.filter(number__startswith=prefix).count() + 1
            self.number = f"{prefix}-{sequence:04d}"
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        subtotal = Decimal("0.00")
        tax = Decimal("0.00")
        discount = Decimal("0.00")

        for item in self.items.all():
            subtotal += item.total_price

        self.subtotal_amount = subtotal
        self.tax_amount = tax
        self.discount_amount = discount
        self.total_amount = subtotal + tax - discount
        self.save(update_fields=[
            "subtotal_amount",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "updated_at",
        ])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.product.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = Decimal(self.unit_price) * Decimal(self.quantity)
        super().save(*args, **kwargs)
