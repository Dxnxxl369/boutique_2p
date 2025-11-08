import 'package:flutter/foundation.dart';

import 'product.dart';

class Order {
  const Order({
    required this.id,
    this.number,
    required this.customerName,
    this.customerEmail,
    this.customerPhone,
    this.customerAddress,
    required this.paymentMethod,
    required this.status,
    this.notes,
    required this.subtotalAmount,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalAmount,
    this.createdAt,
    this.updatedAt,
    this.createdByName,
    required this.items,
  });

  final int id;
  final String? number;
  final String customerName;
  final String? customerEmail;
  final String? customerPhone;
  final String? customerAddress;
  final String paymentMethod;
  final String status;
  final String? notes;
  final double subtotalAmount;
  final double taxAmount;
  final double discountAmount;
  final double totalAmount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? createdByName;
  final List<OrderItem> items;

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as int,
      number: json['number'] as String?,
      customerName: json['customer_name'] as String,
      customerEmail: json['customer_email'] as String?,
      customerPhone: json['customer_phone'] as String?,
      customerAddress: json['customer_address'] as String?,
      paymentMethod: json['payment_method'] as String,
      status: json['status'] as String,
      notes: json['notes'] as String?,
      subtotalAmount:
          double.tryParse(json['subtotal_amount'].toString()) ?? 0.0,
      taxAmount: double.tryParse(json['tax_amount'].toString()) ?? 0.0,
      discountAmount:
          double.tryParse(json['discount_amount'].toString()) ?? 0.0,
      totalAmount: double.tryParse(json['total_amount'].toString()) ?? 0.0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      createdByName: json['created_by_name'] as String?,
      items: (json['items'] as List<dynamic>)
          .map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class OrderItem {
  const OrderItem({
    this.id,
    required this.productId,
    this.productName,
    this.sku,
    required this.quantity,
    required this.unitPrice,
    this.totalPrice,
  });

  final int? id;
  final int productId;
  final String? productName;
  final String? sku;
  final int quantity;
  final double unitPrice;
  final double? totalPrice;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as int?,
      productId: json['product'] as int,
      productName: json['product_name'] as String?,
      sku: json['sku'] as String?,
      quantity: json['quantity'] as int,
      unitPrice: double.tryParse(json['unit_price'].toString()) ?? 0.0,
      totalPrice: json['total_price'] != null
          ? double.tryParse(json['total_price'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product': productId,
      'quantity': quantity,
      'unit_price': unitPrice,
    };
  }
}
