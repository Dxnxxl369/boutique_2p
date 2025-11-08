import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final cart = context.read<CartProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirmar Pedido'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Shipping Information
          Text('Información de Envío', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user?.fullName ?? 'No name', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(user?.email ?? 'No email'),
                  const SizedBox(height: 4),
                  Text(user?.phone ?? 'No phone'),
                  const SizedBox(height: 4),
                  Text(user?.address ?? 'No address provided'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Order Summary
          Text('Resumen del Pedido', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: cart.items.length,
              itemBuilder: (context, index) {
                final item = cart.items[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: item.product.image != null ? NetworkImage(item.product.image!) : null,
                    child: item.product.image == null ? const Icon(Icons.image) : null,
                  ),
                  title: Text(item.product.name),
                  subtitle: Text('Cant: ${item.quantity}'),
                  trailing: Text('\$${item.totalPrice.toStringAsFixed(2)}'),
                );
              },
              separatorBuilder: (_, __) => const Divider(height: 1),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildCheckoutSummary(context),
    );
  }

  Widget _buildCheckoutSummary(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final orderProvider = context.watch<OrderProvider>();
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.all(0),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0).copyWith(bottom: 24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total:', style: theme.textTheme.headlineSmall),
                Text(
                  '\$${cart.totalPrice.toStringAsFixed(2)}',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: orderProvider.status == OrderStatus.loading
                    ? null
                    : () async {
                        final success = await context.read<OrderProvider>().createOrderFromCart(cart);
                        if (success && context.mounted) {
                          // TODO: Navigate to an OrderConfirmationScreen
                          Navigator.of(context).popUntil((route) => route.isFirst);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('¡Pedido realizado con éxito!')),
                          );
                        } else if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error al realizar el pedido: ${orderProvider.errorMessage}')),
                          );
                        }
                      },
                child: orderProvider.status == OrderStatus.loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Realizar Pedido'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
