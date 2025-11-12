import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../../widgets/order_card.dart';
import 'order_detail_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return RefreshIndicator(
      onRefresh: () => context.read<OrderProvider>().fetchUserOrders(),
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // User Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user?.fullName ?? 'No name', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  _buildInfoRow(Icons.person_outline, user?.username ?? '...'),
                  _buildInfoRow(Icons.email_outlined, user?.email ?? '...'),
                  _buildInfoRow(Icons.phone_outlined, user?.phone ?? 'No proporcionado'),
                  _buildInfoRow(Icons.home_outlined, user?.address ?? 'No proporcionada'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Orders Section
          Text('Mis Pedidos', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          _buildOrderList(context),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(text),
        ],
      ),
    );
  }

  Widget _buildOrderList(BuildContext context) {
    return Consumer<OrderProvider>(
      builder: (context, orderProvider, child) {
        switch (orderProvider.status) {
          case OrderStatus.loading:
            return const Center(child: CircularProgressIndicator());
          case OrderStatus.error:
            return Center(child: Text('Error: ${orderProvider.errorMessage}'));
          case OrderStatus.success:
            if (orderProvider.orders.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Text('No tienes pedidos anteriores.'),
                ),
              );
            }
            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: orderProvider.orders.length,
              itemBuilder: (context, index) {
                final Order order = orderProvider.orders[index];
                return OrderCard(
                  order: order,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => OrderDetailScreen(order: order),
                      ),
                    );
                  },
                );
              },
            );
          case OrderStatus.initial:
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }
}
