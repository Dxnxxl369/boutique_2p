import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from products.models import Category, Product

class Command(BaseCommand):
    help = 'Creates 50 sample products for the boutique.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting to create sample products...'))

        # 1. Create Categories
        categories_data = [
            {'name': 'Vestidos', 'description': 'Vestidos para toda ocasión.'},
            {'name': 'Blusas y Camisas', 'description': 'Blusas y camisas elegantes y casuales.'},
            {'name': 'Pantalones y Faldas', 'description': 'Pantalones y faldas para completar tu look.'},
            {'name': 'Accesorios', 'description': 'Bolsos, cinturones y más.'},
            {'name': 'Calzado', 'description': 'Zapatos, botas y sandalias.'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories[cat_data['name']] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Category "{category.name}" created.'))
            else:
                self.stdout.write(self.style.WARNING(f'Category "{category.name}" already exists.'))

        # 2. Define Product Data
        products_data = [
            # Vestidos (10)
            {'name': 'Vestido de Noche "Elegancia"', 'category': 'Vestidos', 'price': 129.99, 'brand': 'Glamour & Co.'},
            {'name': 'Vestido Casual "Verano"', 'category': 'Vestidos', 'price': 59.99, 'brand': 'Sol y Arena'},
            {'name': 'Vestido de Cóctel "Medianoche"', 'category': 'Vestidos', 'price': 89.99, 'brand': 'Glamour & Co.'},
            {'name': 'Vestido Largo Floral', 'category': 'Vestidos', 'price': 79.99, 'brand': 'Natura Chic'},
            {'name': 'Vestido Camisero de Lino', 'category': 'Vestidos', 'price': 69.99, 'brand': 'Sol y Arena'},
            {'name': 'Vestido Tubino Clásico', 'category': 'Vestidos', 'price': 99.99, 'brand': 'Oficina Style'},
            {'name': 'Vestido de Punto Acanalado', 'category': 'Vestidos', 'price': 65.50, 'brand': 'Confort Zone'},
            {'name': 'Vestido Bohemio con Bordados', 'category': 'Vestidos', 'price': 85.00, 'brand': 'Natura Chic'},
            {'name': 'Vestido Cruzado (Wrap Dress)', 'category': 'Vestidos', 'price': 75.99, 'brand': 'Glamour & Co.'},
            {'name': 'Vestido Corto de Fiesta', 'category': 'Vestidos', 'price': 110.00, 'brand': 'Glamour & Co.'},
            
            # Blusas y Camisas (10)
            {'name': 'Blusa de Seda "Marfil"', 'category': 'Blusas y Camisas', 'price': 49.99, 'brand': 'Oficina Style'},
            {'name': 'Camisa de Algodón "Clásica"', 'category': 'Blusas y Camisas', 'price': 39.99, 'brand': 'Urban Basic'},
            {'name': 'Top de Encaje "Romance"', 'category': 'Blusas y Camisas', 'price': 34.99, 'brand': 'Glamour & Co.'},
            {'name': 'Blusa con Volantes', 'category': 'Blusas y Camisas', 'price': 45.00, 'brand': 'Natura Chic'},
            {'name': 'Camisa Vaquera (Denim)', 'category': 'Blusas y Camisas', 'price': 55.99, 'brand': 'Urban Basic'},
            {'name': 'Blusa de Hombros Descubiertos', 'category': 'Blusas y Camisas', 'price': 42.50, 'brand': 'Sol y Arena'},
            {'name': 'Camisa de Lino Blanca', 'category': 'Blusas y Camisas', 'price': 52.00, 'brand': 'Sol y Arena'},
            {'name': 'Top Lencero Satinado', 'category': 'Blusas y Camisas', 'price': 29.99, 'brand': 'Glamour & Co.'},
            {'name': 'Blusa Peplum', 'category': 'Blusas y Camisas', 'price': 48.00, 'brand': 'Oficina Style'},
            {'name': 'Camisa a Cuadros Leñador', 'category': 'Blusas y Camisas', 'price': 49.99, 'brand': 'Urban Basic'},

            # Pantalones y Faldas (10)
            {'name': 'Pantalón Palazzo de Talle Alto', 'category': 'Pantalones y Faldas', 'price': 69.99, 'brand': 'Oficina Style'},
            {'name': 'Jeans Skinny "Ajuste Perfecto"', 'category': 'Pantalones y Faldas', 'price': 59.99, 'brand': 'Urban Basic'},
            {'name': 'Falda Midi Plisada', 'category': 'Pantalones y Faldas', 'price': 54.99, 'brand': 'Natura Chic'},
            {'name': 'Pantalones Culotte', 'category': 'Pantalones y Faldas', 'price': 62.00, 'brand': 'Oficina Style'},
            {'name': 'Falda de Cuero Sintético', 'category': 'Pantalones y Faldas', 'price': 58.50, 'brand': 'Urban Basic'},
            {'name': 'Jeans "Mom Fit" Vintage', 'category': 'Pantalones y Faldas', 'price': 65.00, 'brand': 'Urban Basic'},
            {'name': 'Falda Larga Bohemio', 'category': 'Pantalones y Faldas', 'price': 49.99, 'brand': 'Natura Chic'},
            {'name': 'Pantalones Cargo', 'category': 'Pantalones y Faldas', 'price': 55.00, 'brand': 'Urban Basic'},
            {'name': 'Minifalda Vaquera', 'category': 'Pantalones y Faldas', 'price': 39.99, 'brand': 'Sol y Arena'},
            {'name': 'Leggings Efecto Piel', 'category': 'Pantalones y Faldas', 'price': 35.99, 'brand': 'Confort Zone'},

            # Accesorios (10)
            {'name': 'Bolso Tote de Cuero', 'category': 'Accesorios', 'price': 89.99, 'brand': 'Artesanía Piel'},
            {'name': 'Cinturón Ancho con Hebilla Dorada', 'category': 'Accesorios', 'price': 29.99, 'brand': 'Glamour & Co.'},
            {'name': 'Pañuelo de Seda Estampado', 'category': 'Accesorios', 'price': 24.99, 'brand': 'Natura Chic'},
            {'name': 'Gafas de Sol "Cat Eye"', 'category': 'Accesorios', 'price': 45.00, 'brand': 'Sol y Arena'},
            {'name': 'Sombrero de Paja "Fedora"', 'category': 'Accesorios', 'price': 35.00, 'brand': 'Sol y Arena'},
            {'name': 'Collar de Perlas Falsas', 'category': 'Accesorios', 'price': 39.99, 'brand': 'Glamour & Co.'},
            {'name': 'Mochila Urbana de Lona', 'category': 'Accesorios', 'price': 59.99, 'brand': 'Urban Basic'},
            {'name': 'Pendientes Largos de Fiesta', 'category': 'Accesorios', 'price': 19.99, 'brand': 'Glamour & Co.'},
            {'name': 'Bandolera Pequeña', 'category': 'Accesorios', 'price': 49.99, 'brand': 'Artesanía Piel'},
            {'name': 'Gorro de Lana (Beanie)', 'category': 'Accesorios', 'price': 15.99, 'brand': 'Confort Zone'},

            # Calzado (10)
            {'name': 'Zapatos de Tacón "Stiletto"', 'category': 'Calzado', 'price': 99.99, 'brand': 'Glamour & Co.'},
            {'name': 'Botines de Cuero "Chelsea"', 'category': 'Calzado', 'price': 119.99, 'brand': 'Artesanía Piel'},
            {'name': 'Zapatillas Deportivas "Urbanas"', 'category': 'Calzado', 'price': 79.99, 'brand': 'Urban Basic'},
            {'name': 'Sandalias Planas de Tiras', 'category': 'Calzado', 'price': 49.99, 'brand': 'Sol y Arena'},
            {'name': 'Mocasines de Piel', 'category': 'Calzado', 'price': 89.99, 'brand': 'Oficina Style'},
            {'name': 'Botas Altas de Ante', 'category': 'Calzado', 'price': 149.99, 'brand': 'Artesanía Piel'},
            {'name': 'Sandalias de Plataforma', 'category': 'Calzado', 'price': 69.99, 'brand': 'Sol y Arena'},
            {'name': 'Zapatos "Oxford" de Charol', 'category': 'Calzado', 'price': 95.00, 'brand': 'Oficina Style'},
            {'name': 'Zapatillas de Lona', 'category': 'Calzado', 'price': 55.00, 'brand': 'Urban Basic'},
            {'name': 'Botas de Agua', 'category': 'Calzado', 'price': 45.99, 'brand': 'Confort Zone'},
        ]

        # 3. Create Products
        for i, prod_data in enumerate(products_data):
            category_name = prod_data.pop('category')
            category_obj = categories[category_name]
            
            # Generate random data
            sku = f"{category_obj.name[:3].upper()}-{prod_data['brand'][:3].upper()}-{1000+i}"
            stock = random.randint(5, 100)
            cost = Decimal(prod_data['price']) * Decimal(random.uniform(0.5, 0.7))
            
            # Use a placeholder image service
            image_url = f"https://picsum.photos/seed/{sku}/800/800"

            Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': prod_data['name'],
                    'description': f"Una descripción para el producto {prod_data['name']}. "
                                   f"De la marca {prod_data['brand']}, es una pieza esencial para cualquier guardarropa. "
                                   f"Hecho con materiales de alta calidad para asegurar durabilidad y confort.",
                    'price': Decimal(prod_data['price']),
                    'cost': cost.quantize(Decimal('0.01')),
                    'category': category_obj,
                    'stock': stock,
                    'brand': prod_data['brand'],
                    'image': image_url,
                    'status': 'active',
                }
            )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created or updated {len(products_data)} products.'))
