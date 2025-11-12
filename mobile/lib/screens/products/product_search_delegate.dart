import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../providers/product_provider.dart';
import '../../widgets/product_card.dart';
import 'product_detail_screen.dart';

class ProductSearchDelegate extends SearchDelegate<String> {
  final List<Product> products;

  ProductSearchDelegate(this.products);

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
        },
      ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, '');
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    final List<Product> searchResults = products
        .where((product) =>
            product.name.toLowerCase().contains(query.toLowerCase()) ||
            (product.description?.toLowerCase() ?? '').contains(query.toLowerCase()))
        .toList();

    return GridView.builder(
      padding: const EdgeInsets.all(8.0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8.0,
        mainAxisSpacing: 8.0,
        childAspectRatio: 0.75,
      ),
      itemCount: searchResults.length,
      itemBuilder: (context, index) {
        final product = searchResults[index];
        return ProductCard(
          product: product,
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => ProductDetailScreen(product: product),
            ));
          },
        );
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    final List<Product> suggestionList = query.isEmpty
        ? []
        : products
            .where((product) =>
                product.name.toLowerCase().contains(query.toLowerCase()) ||
                (product.description?.toLowerCase() ?? '').contains(query.toLowerCase()))
            .toList();

    return GridView.builder(
      padding: const EdgeInsets.all(8.0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8.0,
        mainAxisSpacing: 8.0,
        childAspectRatio: 0.75,
      ),
      itemCount: suggestionList.length,
      itemBuilder: (context, index) {
        final product = suggestionList[index];
        return ProductCard(
          product: product,
          onTap: () {
            query = product.name; // Set query to the selected product name
            showResults(context); // Show results for the selected product
          },
        );
      },
    );
  }
}