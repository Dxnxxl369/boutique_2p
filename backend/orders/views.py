from datetime import timedelta
from decimal import Decimal

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
import io
import openpyxl
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from .serializers import OrderSerializer
import re
import unicodedata

# Function to remove accents
def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])


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
    http_method_names = ["get", "post", "patch", "head", "options"]

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

    def _get_report_data(self, period: str = "month"):
        today = timezone.localdate()
        current_year = today.year
        
        completed_orders_base = Order.objects.filter(status=Order.Status.COMPLETED)

        if period == "week":
            start_date = today - timedelta(days=today.weekday()) # Monday
            completed_orders = completed_orders_base.filter(created_at__date__gte=start_date)
        elif period == "month":
            completed_orders = completed_orders_base.filter(created_at__year=today.year, created_at__month=today.month)
        elif period == "year":
            completed_orders = completed_orders_base.filter(created_at__year=today.year)
        else: # Default to month if invalid period
            completed_orders = completed_orders_base.filter(created_at__year=today.year, created_at__month=today.month)

        decimal_zero = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
        cost_expression = ExpressionWrapper(
            Coalesce(F("product__cost"), decimal_zero),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        item_cost_expression = ExpressionWrapper(
            cost_expression * F("quantity"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        # Monthly sales (this will now be filtered by the period for all reports)
        monthly_items_qs = (
            OrderItem.objects.filter(
                order__in=completed_orders, # Filter by the period-adjusted completed_orders
            )
            .annotate(month=TruncMonth("order__created_at"))
            .values("month")
            .annotate(
                sales=Coalesce(Sum("total_price"), decimal_zero),
                costs=Coalesce(Sum(item_cost_expression), decimal_zero),
            )
            .order_by("month")
        )

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
                "sales": str(record["sales"]),
                "costs": str(record["costs"]),
                "profits": str(record["sales"] - record["costs"]),
            }
            for record in monthly_items_qs
        ]

        category_sales_qs = (
            OrderItem.objects.filter(order__status=Order.Status.COMPLETED)
            .values("product__category__name")
            .annotate(
                amount=Coalesce(Sum("total_price"), Value(0, output_field=DecimalField())),
                units=Coalesce(Sum("quantity"), 0)
            )
            .order_by("-amount")
        )
        category_sales = [
            {
                "category": record["product__category__name"] or "Sin categoría",
                "amount": str(record["amount"]),
                "units": int(record["units"]),
            }
            for record in category_sales_qs
        ]

        payment_methods_qs = (
            completed_orders.values("payment_method")
            .annotate(
                count=Count("id"),
                amount=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
            )
            .order_by("-amount")
        )
        payment_methods = [
            {
                "method": record["payment_method"],
                "count": record["count"],
                "amount": str(record["amount"]),
            }
            for record in payment_methods_qs
        ]

        top_customers_qs = (
            completed_orders.values("customer_name", "customer_phone")
            .annotate(
                orders=Count("id"),
                amount=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
            )
            .order_by("-amount")[:5]
        )
        top_customers = [
            {
                "name": record["customer_name"],
                "phone": record["customer_phone"],
                "orders": int(record["orders"]),
                "amount": str(record["amount"]),
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

        return {
            "monthly_sales": monthly_sales,
            "category_sales": category_sales,
            "payment_methods": payment_methods,
            "top_customers": top_customers,
            "inventory_status": inventory_status,
        }

    @action(detail=False, methods=["get"], url_path="reports-summary")
    def reports_summary(self, request):
        period = request.query_params.get("period", "month")
        data = self._get_report_data(period=period)
        return Response(data)

    @action(detail=False, methods=["get"], url_path="reports-pdf")
    def reports_pdf(self, request):
        period = request.query_params.get("period", "month")
        report_data = self._get_report_data(period=period)
        monthly_sales = report_data["monthly_sales"]
        category_sales = report_data["category_sales"]
        payment_methods = report_data["payment_methods"]
        top_customers = report_data["top_customers"]
        inventory_status = report_data["inventory_status"]

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph("Reporte de Ventas y Rendimiento", styles['h1']))
        story.append(Spacer(1, 0.2 * inch))

        # Monthly Sales
        if monthly_sales: # Add check for empty data
            story.append(Paragraph("Ventas Mensuales", styles['h2']))
            data = [["Mes", "Ventas", "Costos", "Ganancias"]]
            for item in monthly_sales:
                data.append([item["month"], item["sales"], item["costs"], item["profits"]])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(PageBreak())
        else:
            story.append(Paragraph("No hay datos de ventas mensuales para mostrar.", styles['Normal']))
            story.append(PageBreak())

        # Category Sales
        if category_sales: # Add check for empty data
            story.append(Paragraph("Ventas por Categoría", styles['h2']))
            data = [["Categoría", "Monto", "Unidades"]]
            for item in category_sales:
                data.append([item["category"], item["amount"], item["units"]])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(PageBreak())
        else:
            story.append(Paragraph("No hay datos de ventas por categoría para mostrar.", styles['Normal']))
            story.append(PageBreak())

        # Payment Methods
        if payment_methods: # Add check for empty data
            story.append(Paragraph("Métodos de Pago", styles['h2']))
            data = [["Método", "Cantidad", "Monto"]]
            for item in payment_methods:
                data.append([item["method"], item["count"], item["amount"]])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(PageBreak())
        else:
            story.append(Paragraph("No hay datos de métodos de pago para mostrar.", styles['Normal']))
            story.append(PageBreak())

        # Top Customers
        if top_customers: # Add check for empty data
            story.append(Paragraph("Top Clientes", styles['h2']))
            data = [["Nombre", "Teléfono", "Órdenes", "Monto"]]
            for item in top_customers:
                data.append([item["name"], item["phone"], item["orders"], item["amount"]])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(PageBreak())
        else:
            story.append(Paragraph("No hay datos de top clientes para mostrar.", styles['Normal']))
            story.append(PageBreak())

        # Inventory Status
        if inventory_status: # Add check for empty data
            story.append(Paragraph("Estado del Inventario", styles['h2']))
            data = [["Producto", "Stock", "Estado"]]
            for item in inventory_status:
                data.append([item["product"], item["stock"], item["status"]])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
        else:
            story.append(Paragraph("No hay datos de estado de inventario para mostrar.", styles['Normal']))

        # Monthly Sales
        story.append(Paragraph("Ventas Mensuales", styles['h2']))
        data = [["Mes", "Ventas", "Costos", "Ganancias"]]
        for item in monthly_sales:
            data.append([item["month"], item["sales"], item["costs"], item["profits"]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(PageBreak())

        # Category Sales
        story.append(Paragraph("Ventas por Categoría", styles['h2']))
        data = [["Categoría", "Monto", "Unidades"]]
        for item in category_sales:
            data.append([item["category"], item["amount"], item["units"]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(PageBreak())

        # Payment Methods
        story.append(Paragraph("Métodos de Pago", styles['h2']))
        data = [["Método", "Cantidad", "Monto"]]
        for item in payment_methods:
            data.append([item["method"], item["count"], item["amount"]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(PageBreak())

        # Top Customers
        story.append(Paragraph("Top Clientes", styles['h2']))
        data = [["Nombre", "Teléfono", "Órdenes", "Monto"]]
        for item in top_customers:
            data.append([item["name"], item["phone"], item["orders"], item["amount"]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(PageBreak())

        # Inventory Status
        story.append(Paragraph("Estado del Inventario", styles['h2']))
        data = [["Producto", "Stock", "Estado"]]
        for item in inventory_status:
            data.append([item["product"], item["stock"], item["status"]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_ventas.pdf"'
        return response

    @action(detail=False, methods=["post"], url_path="voice-command")
    def voice_command(self, request):
        original_command_text = request.data.get("command_text", "")
        pills_data = request.data.get("pills", [])
        
        response_data = {"message": "Comando no reconocido o sin resultados."}

        if pills_data:
            # Process pills
            filters = Q()
            model_to_query = None
            
            for pill in pills_data:
                field = pill.get("field")
                operator = pill.get("operator")
                value = pill.get("value")

                if not all([field, operator, value is not None]):
                    response_data = {"message": f"Píldora mal formada: {pill}"}
                    return Response(response_data, status=400)

                # Determine the model based on the field
                if field in ["name", "price", "stock", "category__name"]:
                    model_to_query = Product
                elif field in ["customer_name", "customer_phone", "orders", "amount"]:
                    model_to_query = Order
                # Add more model mappings as needed

                if not model_to_query:
                    response_data = {"message": f"Campo '{field}' no reconocido para filtrar."}
                    return Response(response_data, status=400)

                # Map operators to Django ORM lookups
                lookup = ""
                if operator == "eq":
                    lookup = "" # exact match is default
                elif operator == "gt":
                    lookup = "__gt"
                elif operator == "lt":
                    lookup = "__lt"
                elif operator == "contains":
                    lookup = "__icontains" # case-insensitive contains
                # Add more operators as needed

                filter_param = f"{field}{lookup}"
                
                # Handle Decimal conversion for price/amount fields
                if field in ["price", "amount"] and isinstance(value, str):
                    try:
                        value = Decimal(value.replace(',', '.'))
                    except Exception as e:
                        response_data = {"message": f"Valor '{value}' para '{field}' no es un número válido: {e}"}
                        return Response(response_data, status=400)
                
                filters &= Q(**{filter_param: value})
            
            if model_to_query == Product:
                results_qs = Product.objects.filter(filters).values("name", "price", "stock")
                results = [{"name": p["name"], "price": float(p["price"]), "stock": p["stock"]} for p in results_qs]
                response_data = {"report_type": "filtered_products", "data": results}
            elif model_to_query == Order:
                results_qs = Order.objects.filter(filters).values("number", "customer_name", "total_amount", "status")
                results = [{"number": o["number"], "customer_name": o["customer_name"], "total_amount": float(o["total_amount"]), "status": o["status"]} for o in results_qs]
                response_data = {"report_type": "filtered_orders", "data": results}
            # Add more model handling as needed
            
            if not results:
                response_data = {"message": "No se encontraron resultados con los filtros aplicados."}
            
            return Response(response_data)

        elif original_command_text:
            command_text = remove_accents(original_command_text).lower().strip('.,!?') # Normalize command_text
            print(f"Received original voice command: {original_command_text}")
            print(f"Received normalized voice command: {command_text}")

            if "productos" in command_text and "vendidos" in command_text: # More flexible check
                try:
                    top_products_qs = (
                        OrderItem.objects.filter(order__status=Order.Status.COMPLETED)
                        .values("product__name")
                        .annotate(
                            units=Coalesce(Sum("quantity"), 0),
                            amount=Coalesce(Sum("total_price"), Value(0, output_field=DecimalField())),
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
                    response_data = {"report_type": "top_products", "data": top_products}
                except Exception as e:
                    print(f"Error processing 'productos mas vendidos': {e}")
                    response_data = {"message": f"Error al procesar 'productos mas vendidos': {e}"}
            elif "clientes" in command_text and "frecuentes" in command_text: # More flexible check
                try:
                    completed_orders = Order.objects.filter(status=Order.Status.COMPLETED)
                    top_customers_qs = (
                        completed_orders.values("customer_name", "customer_phone")
                        .annotate(
                            orders=Count("id"),
                            amount=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
                        )
                        .order_by("-amount")[:5]
                    )
                    top_customers = [
                        {
                            "name": record["customer_name"],
                            "phone": record["customer_phone"],
                            "orders": int(record["orders"]),
                            "amount": str(record["amount"]),
                        }
                        for record in top_customers_qs
                    ]
                    response_data = {"report_type": "top_customers", "data": top_customers}
                except Exception as e:
                    print(f"Error processing 'clientes frecuentes': {e}")
                    response_data = {"message": f"Error al procesar 'clientes frecuentes': {e}"}
            elif "productos" in command_text and ("bajo stock" in command_text or "stock bajo" in command_text): # More flexible check
                try:
                    low_stock_products_qs = Product.objects.filter(stock__lt=20).values("name", "stock").order_by("stock")
                    low_stock_products = [
                        {"name": product["name"], "stock": product["stock"]}
                        for product in low_stock_products_qs
                    ]
                    response_data = {"report_type": "low_stock_products", "data": low_stock_products}
                except Exception as e:
                    print(f"Error processing 'productos con bajo stock': {e}")
                    response_data = {"message": f"Error al procesar 'productos con bajo stock': {e}"}
            elif "productos con valor mayor a" in command_text:
                try:
                    # Extract the number after "mayor a"
                    value_str = command_text.split("productos con valor mayor a")[-1].strip().split(" ")[0]
                    value_str = value_str.replace(',', '.') # Added: Replace comma with dot
                    print(f"Attempting to convert value_str to Decimal: '{value_str}'")
                    value = Decimal(value_str)
                    
                    products_above_value_qs = Product.objects.filter(price__gt=value).values("name", "price")
                    products_above_value = [
                        {"name": product["name"], "price": float(p["price"])}
                        for p in products_above_value_qs
                    ]
                    response_data = {"report_type": "products_above_value", "data": products_above_value}
                except (ValueError, IndexError) as e: # Catch specific exceptions
                    print(f"Error processing 'productos con valor mayor a': {e}")
                    response_data = {"message": f"No se pudo interpretar el valor para 'productos con valor mayor a': {e}"}
                except Exception as e: # Catch any other exception
                    print(f"Error processing 'productos con valor mayor a': {e}")
                    response_data = {"message": f"Error al procesar 'productos con valor mayor a': {e}"}
            elif "producto con valor" in command_text or "producto igual al valor" in command_text:
                try:
                    # Determine the keyword used
                    keyword = ""
                    if "producto con valor igual a" in command_text:
                        keyword = "producto con valor igual a"
                    elif "producto igual al valor" in command_text:
                        keyword = "producto igual al valor"
                    elif "producto con valor" in command_text:
                        keyword = "producto con valor"
                    
                    # Extract the number after the keyword
                    # A more robust way to extract the number
                    match = re.search(r'(\d+([.,]\d+)?)', command_text.split(keyword)[-1])
                    if match:
                        value_str = match.group(1)
                    else:
                        raise ValueError("No se encontró un valor numérico en el comando.")

                    value_str = value_str.replace(',', '.') # Replace comma with dot
                    print(f"Attempting to convert value_str to Decimal: '{value_str}'")
                    value = Decimal(value_str)
                    
                    products_equal_value_qs = Product.objects.filter(price=value).values("name", "price")
                    products_equal_value = [
                        {"name": product["name"], "price": float(p["price"])}
                        for p in products_equal_value_qs
                    ]
                    response_data = {"report_type": "products_equal_value", "data": products_equal_value}
                except (ValueError, IndexError) as e:
                    print(f"Error processing 'producto con valor X': {e}")
                    response_data = {"message": f"No se pudo interpretar el valor numérico para 'producto con valor X': {e}"}
                except Exception as e:
                    print(f"Error processing 'producto con valor X': {e}")
                    response_data = {"message": f"Error al procesar 'producto con valor X': {e}"}
            
            return Response(response_data)
        
        return Response(response_data)

    @action(detail=False, methods=["get"], url_path="reports-excel")
    def reports_excel(self, request):
        period = request.query_params.get("period", "month")
        report_data = self._get_report_data(period=period)
        monthly_sales = report_data["monthly_sales"]
        category_sales = report_data["category_sales"]
        payment_methods = report_data["payment_methods"]
        top_customers = report_data["top_customers"]
        inventory_status = report_data["inventory_status"]

        output = io.BytesIO()
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "Reporte de Ventas"

        # Monthly Sales
        sheet.append(["Reporte de Ventas Mensuales"])
        sheet.append(["Mes", "Ventas", "Costos", "Ganancias"])
        for item in monthly_sales:
            sheet.append([item["month"], item["sales"], item["costs"], item["profits"]])
        sheet.append([])

        # Category Sales
        sheet.append(["Ventas por Categoría"])
        sheet.append(["Categoría", "Monto", "Unidades"])
        for item in category_sales:
            sheet.append([item["category"], item["amount"], item["units"]])
        sheet.append([])

        # Payment Methods
        sheet.append(["Método", "Cantidad", "Monto"])
        for item in payment_methods:
            sheet.append([item["method"], item["count"], item["amount"]])
        sheet.append([])

        # Top Customers
        sheet.append(["Nombre", "Teléfono", "Órdenes", "Monto"])
        for item in top_customers:
            sheet.append([item["name"], item["phone"], item["orders"], item["amount"]])
        sheet.append([])

        # Inventory Status
        sheet.append(["Producto", "Stock", "Estado"])
        for item in inventory_status:
            sheet.append([item["product"], item["stock"], item["status"]])
        sheet.append([])

        workbook.save(output)
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="reporte_ventas.xlsx"'
        return response
