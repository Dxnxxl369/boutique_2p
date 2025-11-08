from django.contrib import admin
from .models import Category, Product, InventoryMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'description']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'price', 'stock', 'status', 'created_at']
    list_filter = ['category', 'status', 'size', 'color']
    search_fields = ['name', 'sku', 'brand', 'description']
    list_editable = ['price', 'stock', 'status']


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reason', 'stock_before', 'stock_after', 'created_by', 'created_at']
    list_filter = ['movement_type', 'reason', 'created_at']
    search_fields = ['product__name', 'notes']
    readonly_fields = ['stock_before', 'stock_after', 'created_by', 'created_at']
