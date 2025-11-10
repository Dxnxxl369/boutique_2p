from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
import csv
import io # Import io module
from django.db.models import Sum, Value, F, Q, DecimalField, IntegerField
from django.db.models.functions import Coalesce
from decimal import Decimal
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, InventoryMovement
from .serializers import CategorySerializer, ProductSerializer, InventoryMovementSerializer, ProductSalesReportSerializer
from .filters import ProductFilter # Import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Allow any user to read, authenticated to write
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['status']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Allow any user to read, authenticated to write
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ProductFilter # Add this line
    search_fields = ['name', 'sku', 'description', 'brand']
    filterset_fields = ['category', 'status', 'size', 'color']
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='sales-report', permission_classes=[IsAuthenticated]) # Only authenticated users can access sales report
    def sales_report(self, request):
        """
        Generates a sales report for products, with optional CSV export.
        """
        # Annotate products with sales data
        sales_filter = Q(order_items__order__status__in=['completed', 'shipped'])
        queryset = Product.objects.annotate(
            total_units_sold=Coalesce(Sum('order_items__quantity', filter=sales_filter), Value(0), output_field=IntegerField),
            total_revenue=Coalesce(Sum('order_items__total_price', filter=sales_filter), Value(Decimal('0.00')), output_field=DecimalField)
        )

        # Apply ordering
        ordering = request.query_params.get('ordering', '-total_units_sold')
        if ordering in ['total_units_sold', '-total_units_sold', 'total_revenue', '-total_revenue']:
            queryset = queryset.order_by(ordering)

        # Handle CSV export
        if request.query_params.get('export') == 'csv':
            buffer = io.StringIO()
            # Use semicolon as delimiter for better Excel compatibility in some locales
            writer = csv.writer(buffer, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            
            writer.writerow(['ID', 'SKU', 'Producto', 'Stock Actual', 'Unidades Vendidas', 'Ingresos Totales'])
            
            for product in queryset:
                writer.writerow([
                    product.id,
                    product.sku,
                    product.name,
                    product.stock,
                    product.total_units_sold,
                    product.total_revenue
                ])
            
            # Add UTF-8 BOM for better Excel compatibility
            response = HttpResponse(u'\ufeff' + buffer.getvalue(), content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="product_sales_report.csv"'
            return response

        # Standard API response
        serializer = ProductSalesReportSerializer(queryset, many=True)
        return Response(serializer.data)


class InventoryMovementViewSet(viewsets.ModelViewSet):
    queryset = InventoryMovement.objects.select_related('product', 'created_by').all()
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can manage inventory movements
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type', 'reason']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
