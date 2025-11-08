from datetime import timedelta

from django.db.models import Count, Sum, F, Value, DecimalField, ExpressionWrapper
from django.db.models.functions import Coalesce, TruncDay, TruncMonth
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from products.models import Product
from users.models import User
from .models import Order, OrderItem
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related("items__product").select_related("created_by")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "status": ["exact"],
        "payment_method": ["exact"],
        "created_at": ["date", "date__gte", "date__lte"],
    }
    search_fields = ["number", "customer_name", "customer_email", "customer_phone", "items__product__name"]
    ordering_fields = ["created_at", "total_amount"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if not user.is_staff_member:
            queryset = queryset.filter(created_by=user)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=False, methods=["get"], url_path="dashboard-summary")
    def dashboard_summary(self, request):
        today = timezone.localdate()
        start_week = today - timedelta(days=6)

        completed_orders = Order.objects.filter(status=Order.Status.COMPLETED)
        decimal_zero = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))

        total_products = Product.objects.count()
        total_customers = User.objects.filter(role="user").count()
        today_sales = completed_orders.filter(created_at__date=today).aggregate(
            total=Coalesce(Sum("total_amount"), decimal_zero)
        )["total"]
        month_sales = completed_orders.filter(
            created_at__year=today.year, created_at__month=today.month
        ).aggregate(total=Coalesce(Sum("total_amount"), decimal_zero))["total"]

        # Ventas de la semana
        weekly_sales_qs = (
            completed_orders.filter(created_at__date__gte=start_week)
            .annotate(day=TruncDay("created_at"))
            .values("day")
            .annotate(total=Coalesce(Sum("total_amount"), decimal_zero))
            .order_by("day")
        )
        weekly_sales = [
            {
                "day": record["day"].strftime("%a"),
                "date": record["day"].strftime("%Y-%m-%d"),
                "total": float(record["total"]),
            }
            for record in weekly_sales_qs
        ]

        # Ventas por categoría
        category_sales_qs = (
            OrderItem.objects.filter(order__status=Order.Status.COMPLETED)
            .values(name=Coalesce("product__category__name", Value("Sin categoría")))
            .annotate(
                value=Coalesce(Sum("quantity"), 0),
                amount=Coalesce(Sum("total_price"), decimal_zero),
            )
            .order_by("-amount")
        )
        category_sales = [
            {
                "name": record["name"],
                "units": int(record["value"]),
                "amount": float(record["amount"]),
            }
            for record in category_sales_qs
        ]

        # Productos más vendidos
        top_products_qs = (
            OrderItem.objects.filter(order__status=Order.Status.COMPLETED)
            .values("product__name")
            .annotate(
                units=Coalesce(Sum("quantity"), 0),
                amount=Coalesce(Sum("total_price"), decimal_zero),
            )
            .order_by("-units")[:5]
        )
        top_products = [
            {
                "name": record["product__name"],
                "units": int(record["units"]),
                "amount": float(record["amount"]),
            }
            for record in top_products_qs
        ]

        data = {
            "stats": {
                "total_products": total_products,
                "total_customers": total_customers,
                "today_sales": float(today_sales),
                "month_sales": float(month_sales),
            },
            "weekly_sales": weekly_sales,
            "category_sales": category_sales,
            "top_products": top_products,
        }
        return Response(data)

    @action(detail=False, methods=["get"], url_path="reports-summary")
    def reports_summary(self, request):
        today = timezone.localdate()
        current_year = today.year

        completed_orders = Order.objects.filter(status=Order.Status.COMPLETED)

        decimal_zero = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
        cost_expression = ExpressionWrapper(
            Coalesce(F("product__cost"), decimal_zero),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        item_cost_expression = ExpressionWrapper(
            cost_expression * F("quantity"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        monthly_items_qs = (
            OrderItem.objects.filter(
                order__status=Order.Status.COMPLETED,
                order__created_at__year=current_year,
            )
            .annotate(month=TruncMonth("order__created_at"))
            .values("month")
            .annotate(
                sales=Coalesce(Sum("total_price"), decimal_zero),
                costs=Coalesce(Sum(item_cost_expression), decimal_zero),
            )
            .order_by("month")
        )

        monthly_sales = [
            {
                "month": record["month"].strftime("%b"),
                "sales": float(record["sales"]),
                "costs": float(record["costs"]),
                "profits": float(record["sales"] - record["costs"]),
            }
            for record in monthly_items_qs
        ]

        category_sales_qs = (
            OrderItem.objects.filter(order__status=Order.Status.COMPLETED)
            .values("product__category__name")
            .annotate(amount=Coalesce(Sum("total_price"), 0), units=Coalesce(Sum("quantity"), 0))
            .order_by("-amount")
        )
        category_sales = [
            {
                "category": record["product__category__name"] or "Sin categoría",
                "amount": float(record["amount"]),
                "units": int(record["units"]),
            }
            for record in category_sales_qs
        ]

        payment_methods_qs = (
            completed_orders.values("payment_method")
            .annotate(
                count=Count("id"),
                amount=Coalesce(Sum("total_amount"), 0),
            )
            .order_by("-amount")
        )
        payment_methods = [
            {
                "method": record["payment_method"],
                "count": record["count"],
                "amount": float(record["amount"]),
            }
            for record in payment_methods_qs
        ]

        top_customers_qs = (
            completed_orders.values("customer_name", "customer_phone")
            .annotate(
                orders=Count("id"),
                amount=Coalesce(Sum("total_amount"), 0),
            )
            .order_by("-amount")[:5]
        )
        top_customers = [
            {
                "name": record["customer_name"],
                "phone": record["customer_phone"],
                "orders": record["orders"],
                "amount": float(record["amount"]),
            }
            for record in top_customers_qs
        ]

        inventory_status = [
            {
                "product": product.name,
                "stock": product.stock,
                "status": "ok" if product.stock >= 20 else "low",
            }
            for product in Product.objects.order_by("stock")[:20]
        ]

        data = {
            "monthly_sales": monthly_sales,
            "category_sales": category_sales,
            "payment_methods": payment_methods,
            "top_customers": top_customers,
            "inventory_status": inventory_status,
        }
        return Response(data)
