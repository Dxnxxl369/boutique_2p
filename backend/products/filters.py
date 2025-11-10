from django_filters import rest_framework as filters
from .models import Product

class ProductFilter(filters.FilterSet):
    low_stock = filters.BooleanFilter(method='filter_low_stock')

    class Meta:
        model = Product
        fields = ['category', 'status', 'size', 'color', 'low_stock']

    def filter_low_stock(self, queryset, name, value):
        if value:
            # Define your low stock threshold here, e.g., 10
            return queryset.filter(stock__lt=10)
        return queryset
