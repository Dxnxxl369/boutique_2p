import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/cart_provider.dart';
import '../../widgets/cart_item_card.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Carrito de Compras'),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, child) {
          if (cart.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.remove_shopping_cart_outlined, size: 80),
                  const SizedBox(height: 16),
                  Text(
                    'Tu carrito está vacío',
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: () {
                      // A simple way to go back to the shop is to switch tabs.
                      // This is not ideal, a better approach would use a TabController.
                      // For now, this is a placeholder for that logic.
                      // A more robust solution would be to use a TabController managed
                      // in MainScreen to programmatically switch tabs.
                    },
                    child: const Text('Ir a la Tienda'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(8.0),
                  itemCount: cart.items.length,
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    return CartItemCard(item: item);
                  },
                ),
              ),
              _buildCartSummary(context, cart),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCartSummary(BuildContext context, CartProvider cart) {
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
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total:', style: theme.textTheme.headlineSmall),
                Text(
                  '\$${cart.totalPrice.toStringAsFixed(2)}',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                  );
                },
                child: const Text('Finalizar Compra'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
