from rest_framework import serializers
from django.db import transaction
from .models import Category, Product, InventoryMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'status', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'price', 'cost', 
            'category', 'category_name', 'stock', 'size', 'color', 
            'brand', 'image', 'status', 'created_at', 'updated_at'
        ]

    def validate_sku(self, value):
        if self.instance and self.instance.sku == value:
            return value
        if Product.objects.filter(sku=value).exists():
            raise serializers.ValidationError("Ya existe un producto con este SKU.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        initial_stock = validated_data.get('stock', 0)
        product = super().create(validated_data)
        if initial_stock > 0:
            request = self.context.get('request')
            if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
                raise serializers.ValidationError(
                    "La solicitud no contiene un usuario autenticado para registrar el movimiento de inventario."
                )

            InventoryMovement.objects.create(
                product=product,
                movement_type='entrada',
                quantity=initial_stock,
                reason='inventario_fisico',
                notes='Stock inicial al crear el producto.',
                created_by=request.user,
                stock_before=0,
                stock_after=initial_stock
            )
        return product


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity', 
            'reason', 'notes', 'created_by', 'created_by_name', 
            'stock_before', 'stock_after', 'created_at'
        ]
        read_only_fields = ['created_by', 'stock_before', 'stock_after']

    def create(self, validated_data):
        product = validated_data['product']
        quantity = validated_data['quantity']
        movement_type = validated_data['movement_type']
        
        validated_data['stock_before'] = product.stock
        
        if movement_type == 'entrada':
            product.stock += quantity
        elif movement_type == 'salida':
            product.stock -= quantity
        elif movement_type == 'ajuste':
            product.stock = quantity
        
        product.save()
        validated_data['stock_after'] = product.stock
        
        return super().create(validated_data)