import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/order.dart';

class OrderService {
  OrderService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<List<Order>> fetchOrders(String accessToken) async {
    final uri = Uri.parse('$kApiBaseUrl/orders/');
    final response = await _client.get(
      uri,
      headers: _getAuthHeaders(accessToken),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((item) => Order.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load orders');
    }
  }

  Future<Order> createOrder({
    required String accessToken,
    required String customerName,
    String? customerEmail,
    String? customerPhone,
    String? customerAddress,
    required String paymentMethod,
    required List<OrderItem> items,
  }) async {
    final uri = Uri.parse('$kApiBaseUrl/orders/');
    final body = jsonEncode({
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'customer_address': customerAddress,
      'payment_method': paymentMethod,
      'status': 'pending', // Default status
      'items': items.map((item) => item.toJson()).toList(),
    });

    final response = await _client.post(
      uri,
      headers: _getAuthHeaders(accessToken),
      body: body,
    );

    if (response.statusCode == 201) {
      return Order.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to create order. Status: ${response.statusCode}, Body: ${response.body}');
    }
  }

  Map<String, String> _getAuthHeaders(String accessToken) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

  void dispose() {
    _client.close();
  }
}
