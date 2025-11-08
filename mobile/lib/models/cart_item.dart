import 'package:flutter/foundation.dart';

import 'product.dart';

@immutable
class CartItem {
  const CartItem({required this.product, required this.quantity});

  final Product product;
  final int quantity;

  CartItem copyWith({Product? product, int? quantity}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }

  double get totalPrice => product.price * quantity;
}
