import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/product.dart';
import '../models/category.dart';

class ProductService {
  ProductService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<List<Product>> fetchProducts({String? category}) async {
    final queryParams = <String, String>{};
    if (category != null && category.isNotEmpty) {
      queryParams['category'] = category;
    }

    final uri = Uri.parse('$kApiBaseUrl/products/').replace(
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final response = await _client.get(uri, headers: _defaultHeaders);

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((item) => Product.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load products');
    }
  }

  Future<Product> fetchProduct(int id) async {
    final uri = Uri.parse('$kApiBaseUrl/products/$id/');
    final response = await _client.get(uri, headers: _defaultHeaders);

    if (response.statusCode == 200) {
      return Product.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to load product');
    }
  }

  Future<List<Category>> fetchCategories() async {
    final uri = Uri.parse('$kApiBaseUrl/categories/');
    final response = await _client.get(uri, headers: _defaultHeaders);

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((item) => Category.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load categories');
    }
  }

  Map<String, String> get _defaultHeaders => const <String, String>{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  void dispose() {
    _client.close();
  }
}
