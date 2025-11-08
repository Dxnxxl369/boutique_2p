import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/order.dart';

class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.order, this.onTap});

  final Order order;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formattedDate = order.createdAt != null
        ? DateFormat.yMMMd().format(order.createdAt!)
        : 'N/A';

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pedido #${order.number ?? order.id}',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    formattedDate,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total: \$${order.totalAmount.toStringAsFixed(2)}',
                    style: theme.textTheme.bodyLarge,
                  ),
                  Chip(
                    label: Text(_getSpanishStatus(order.status)),
                    backgroundColor: _getStatusColor(order.status, theme),
                    labelStyle: TextStyle(color: theme.colorScheme.onPrimary, fontSize: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  ),
                ],
              ),
            ],
          ),
        ),
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

  Color _getStatusColor(String status, ThemeData theme) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
