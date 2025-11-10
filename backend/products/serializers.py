from rest_framework import serializers
from .models import Category, Product, InventoryMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'status', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'price', 'cost', 
            'category', 'category_name', 'stock', 'size', 'color', 
            'brand', 'image', 'status', 'created_at', 'updated_at'
        ]

    def get_image(self, obj):
        if obj.image:
            # If the image name is an absolute URL, return it as is.
            if obj.image.name.startswith('http'):
                return obj.image.name
            # Otherwise, build the full URL for the local file.
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


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
        
        # Guardar stock anterior
        validated_data['stock_before'] = product.stock
        
        # Actualizar stock según el tipo de movimiento
        if movement_type == 'entrada':
            product.stock += quantity
        elif movement_type == 'salida':
            product.stock -= quantity
        elif movement_type == 'ajuste':
            product.stock = quantity
        
        product.save()
        validated_data['stock_after'] = product.stock
        
        return super().create(validated_data)
