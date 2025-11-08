import 'package:flutter/foundation.dart' hide Category;

import '../models/product.dart';
import '../models/category.dart';
import '../services/product_service.dart';

enum ProductStatus { initial, loading, success, error }

class ProductProvider extends ChangeNotifier {
  ProductProvider({ProductService? service})
      : _service = service ?? ProductService();

  final ProductService _service;

  ProductStatus _status = ProductStatus.initial;
  List<Product> _products = [];
  List<Category> _categories = [];
  String? _errorMessage;

  ProductStatus get status => _status;
  List<Product> get products => _products;
  List<Category> get categories => _categories;
  String? get errorMessage => _errorMessage;

  Future<void> fetchAllProducts() async {
    _status = ProductStatus.loading;
    notifyListeners();

    try {
      _products = await _service.fetchProducts();
      _status = ProductStatus.success;
    } catch (e) {
      _status = ProductStatus.error;
      _errorMessage = e.toString();
    }
    notifyListeners();
  }

  Future<void> fetchAllCategories() async {
    // Silently fetch categories, or handle loading state separately if needed
    try {
      _categories = await _service.fetchCategories();
    } catch (e) {
      // Handle error, maybe log it
      debugPrint('Failed to fetch categories: $e');
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _service.dispose();
    super.dispose();
  }
}
