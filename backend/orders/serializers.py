from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from products.models import Product, InventoryMovement
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "quantity",
            "unit_price",
            "total_price",
        ]
        read_only_fields = ["id", "product_name", "sku", "total_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "customer_name",
            "customer_email",
            "customer_phone",
            "customer_address",
            "payment_method",
            "status",
            "notes",
            "subtotal_amount",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "created_at",
            "updated_at",
            "created_by",
            "created_by_name",
            "items",
        ]
        read_only_fields = [
            "id",
            "number",
            "subtotal_amount",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "created_at",
            "updated_at",
            "created_by_name",
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Debe agregar al menos un producto a la orden.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        items_data = validated_data.pop("items")
        order = Order.objects.create(
            created_by=request.user if request else None,
            **validated_data,
        )

        subtotal = Decimal("0.00")
        for item_data in items_data:
            product: Product = item_data["product"]
            product = Product.objects.select_for_update().get(pk=product.pk)
            quantity = item_data["quantity"]
            unit_price = Decimal(item_data.get("unit_price") or product.price)

            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
            )
            subtotal += order_item.total_price

            stock_before = product.stock
            stock_after = max(0, stock_before - quantity)
            product.stock = stock_after
            product.save(update_fields=["stock"])

            InventoryMovement.objects.create(
                product=product,
                movement_type="salida",
                quantity=quantity,
                reason="venta",
                notes=f"Orden {order.number}",
                created_by=request.user if request else None,
                stock_before=stock_before,
                stock_after=stock_after,
            )

        order.subtotal_amount = subtotal
        order.total_amount = subtotal - order.discount_amount + order.tax_amount
        order.save(update_fields=["subtotal_amount", "total_amount"])
        return order
