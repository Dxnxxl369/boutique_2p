import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/order.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formattedDate = order.createdAt != null
        ? DateFormat.yMMMd('es_ES').add_jm().format(order.createdAt!)
        : 'N/A';

    return Scaffold(
      appBar: AppBar(
        title: Text('Pedido #${order.number ?? order.id}'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Order Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('Número de Pedido:', order.number ?? order.id.toString()),
                  _buildInfoRow('Fecha del Pedido:', formattedDate),
                  _buildInfoRow('Estado:', _getSpanishStatus(order.status)),
                  _buildInfoRow('Método de Pago:', order.paymentMethod),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Items
          Text('Artículos', style: theme.textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: order.items.length,
              itemBuilder: (context, index) {
                final item = order.items[index];
                return ListTile(
                  title: Text(item.productName ?? 'Producto'),
                  subtitle: Text('Cant: ${item.quantity} x \$${item.unitPrice.toStringAsFixed(2)}'),
                  trailing: Text('\$${item.totalPrice?.toStringAsFixed(2) ?? 'N/A'}'),
                );
              },
              separatorBuilder: (_, __) => const Divider(height: 1),
            ),
          ),
          const SizedBox(height: 16),

          // Totals
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildTotalRow('Subtotal:', order.subtotalAmount),
                  _buildTotalRow('Impuestos:', order.taxAmount),
                  _buildTotalRow('Descuento:', order.discountAmount, isDiscount: true),
                  const Divider(),
                  _buildTotalRow('Total:', order.totalAmount, isBold: true),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getSpanishStatus(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'COMPLETADO';
      case 'pending':
        return 'PENDIENTE';
      case 'cancelled':
        return 'CANCELADO';
      default:
        return status.toUpperCase();
    }
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }

  Widget _buildTotalRow(String label, double value, {bool isBold = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(
            '${isDiscount ? '-' : ''}\$${value.toStringAsFixed(2)}',
            style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal),
          ),
        ],
      ),
    );
  }
}
