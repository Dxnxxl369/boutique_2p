from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "quantity", "unit_price", "total_price"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["number", "customer_name", "payment_method", "status", "total_amount", "created_at"]
    list_filter = ["payment_method", "status", "created_at"]
    search_fields = ["number", "customer_name", "customer_email", "customer_phone"]
    inlines = [OrderItemInline]
    readonly_fields = [
        "number",
        "subtotal_amount",
        "tax_amount",
        "discount_amount",
        "total_amount",
        "created_at",
        "updated_at",
        "created_by",
    ]
