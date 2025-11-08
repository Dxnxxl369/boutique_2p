import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';

import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.length;

  double get totalPrice =>
      _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  void addItem(Product product) {
    final existingItem = _items.firstWhereOrNull(
      (item) => item.product.id == product.id,
    );

    if (existingItem != null) {
      // If item already exists, increase quantity
      final updatedItem = existingItem.copyWith(
        quantity: existingItem.quantity + 1,
      );
      _items[_items.indexOf(existingItem)] = updatedItem;
    } else {
      // Otherwise, add new item
      _items.add(CartItem(product: product, quantity: 1));
    }
    notifyListeners();
  }

  void removeItem(int productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void updateQuantity(int productId, int quantity) {
    final existingItem =
        _items.firstWhereOrNull((item) => item.product.id == productId);

    if (existingItem != null) {
      if (quantity > 0) {
        final updatedItem = existingItem.copyWith(quantity: quantity);
        _items[_items.indexOf(existingItem)] = updatedItem;
      } else {
        // If quantity is 0 or less, remove the item
        removeItem(productId);
      }
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
