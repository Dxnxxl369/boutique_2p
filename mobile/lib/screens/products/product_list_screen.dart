import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/product_provider.dart';
import '../../widgets/product_card.dart';
import 'product_detail_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  @override
  void initState() {
    super.initState();
    // Use addPostFrameCallback to fetch data after the first frame is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // listen: false is important inside initState
      context.read<ProductProvider>().fetchAllProducts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tienda'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: 'Buscar',
            onPressed: () {
              // TODO: Implement search functionality
            },
          ),
        ],
      ),
      body: Consumer<ProductProvider>(
        builder: (context, provider, child) {
          switch (provider.status) {
            case ProductStatus.loading:
              return const Center(child: CircularProgressIndicator());
            case ProductStatus.error:
              return Center(
                child: Text(
                  'Error al cargar los productos: ${provider.errorMessage}',
                ),
              );
            case ProductStatus.success:
              if (provider.products.isEmpty) {
                return const Center(child: Text('No se encontraron productos.'));
              }
              return RefreshIndicator(
                onRefresh: () => provider.fetchAllProducts(),
                child: GridView.builder(
                  padding: const EdgeInsets.all(8.0),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 8.0,
                    mainAxisSpacing: 8.0,
                    childAspectRatio: 0.75,
                  ),
                  itemCount: provider.products.length,
                  itemBuilder: (context, index) {
                    final product = provider.products[index];
                    return ProductCard(
                      product: product,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(product: product),
                        ));
                      },
                    );
                  },
                ),
              );
            case ProductStatus.initial:
            default:
              return const Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }
}
