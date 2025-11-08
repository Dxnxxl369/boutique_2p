import 'package:flutter/foundation.dart';

import '../models/order.dart';
import '../services/order_service.dart';
import 'auth_provider.dart';
import 'cart_provider.dart';

enum OrderStatus { initial, loading, success, error }

class OrderProvider extends ChangeNotifier {
  OrderProvider({
    required this.authProvider,
    OrderService? service,
  }) : _service = service ?? OrderService();

  final OrderService _service;
  final AuthProvider authProvider;

  OrderStatus _status = OrderStatus.initial;
  List<Order> _orders = [];
  String? _errorMessage;

  OrderStatus get status => _status;
  List<Order> get orders => _orders;
  String? get errorMessage => _errorMessage;

  Future<void> fetchUserOrders() async {
    if (authProvider.accessToken == null) return;

    _status = OrderStatus.loading;
    notifyListeners();

    try {
      _orders = await _service.fetchOrders(authProvider.accessToken!);
      _status = OrderStatus.success;
    } catch (e) {
      _status = OrderStatus.error;
      _errorMessage = e.toString();
    }
    notifyListeners();
  }

  Future<bool> createOrderFromCart(CartProvider cartProvider) async {
    if (authProvider.accessToken == null || authProvider.user == null) {
      _errorMessage = 'User not authenticated.';
      return false;
    }
    if (cartProvider.items.isEmpty) {
      _errorMessage = 'Cart is empty.';
      return false;
    }

    _status = OrderStatus.loading;
    notifyListeners();

    try {
      final user = authProvider.user!;
      final items = cartProvider.items
          .map((cartItem) => OrderItem(
                productId: cartItem.product.id,
                quantity: cartItem.quantity,
                unitPrice: cartItem.product.price,
              ))
          .toList();

      await _service.createOrder(
        accessToken: authProvider.accessToken!,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phone,
        customerAddress: user.address,
        paymentMethod: 'cash', // Default payment method
        items: items,
      );

      cartProvider.clearCart();
      await fetchUserOrders(); // Refresh order list
      _status = OrderStatus.success;
      notifyListeners();
      return true;
    } catch (e) {
      _status = OrderStatus.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _service.dispose();
    super.dispose();
  }
}
