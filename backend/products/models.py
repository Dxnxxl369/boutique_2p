from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[('active', 'Activa'), ('inactive', 'Inactiva')], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    stock = models.IntegerField(default=0)
    size = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=50, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('active', 'Activo'), ('inactive', 'Inactivo')], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.sku}"


class InventoryMovement(models.Model):
    MOVEMENT_TYPES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
    ]
    
    REASON_CHOICES = [
        # Entradas
        ('compra', 'Compra a Proveedor'),
        ('devolucion', 'Devolución de Cliente'),
        ('produccion', 'Producción Interna'),
        # Salidas
        ('venta', 'Venta'),
        ('merma', 'Merma o Daño'),
        ('obsequio', 'Obsequio/Promoción'),
        ('devolucion_proveedor', 'Devolución a Proveedor'),
        # Ajustes
        ('inventario_fisico', 'Inventario Físico'),
        ('correccion', 'Corrección de Error'),
        ('otro', 'Otro'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    stock_before = models.IntegerField()
    stock_after = models.IntegerField()

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} - {self.quantity}"

    class Meta:
        ordering = ['-created_at']
