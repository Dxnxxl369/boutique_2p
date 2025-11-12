import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart'; // Import speech_to_text
import 'package:speech_to_text/speech_recognition_result.dart'; // Import speech_recognition_result

import '../../models/product.dart';
import '../../providers/product_provider.dart';
import '../../widgets/product_card.dart';
import '../../widgets/price_range_dialog.dart';
import 'product_detail_screen.dart';

enum PriceRange {
  all,
  under50,
  fiftyTo100,
  over100,
  custom,
}

class ProductListScreen extends StatefulWidget {
  final Function(String)? onSearch;

  const ProductListScreen({super.key, this.onSearch});

  @override
  State<ProductListScreen> createState() => ProductListScreenState();
}

class ProductListScreenState extends State<ProductListScreen> {
  List<Product> _filteredProducts = [];
  String _currentSearchQuery = '';
  PriceRange _selectedPriceRange = PriceRange.all;
  double? _minCustomPrice;
  double? _maxCustomPrice;
  String? _selectedSize;

  final SpeechToText _speechToText = SpeechToText();
  bool _isListening = false;
  String _lastWords = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchAllProducts();
      _initSpeech();
    });
  }

  @override
  void dispose() {
    _speechToText.stop();
    super.dispose();
  }

  void _initSpeech() async {
    _speechToText.initialize(
        onStatus: (status) => print('Speech status: $status'),
        onError: (errorNotification) => print('Speech error: $errorNotification'));
  }

  void startListening() async {
    bool available = await _speechToText.initialize();
    if (available) {
      if (!mounted) return;
      setState(() {
        _isListening = true;
      });
      _speechToText.listen(
        onResult: _onSpeechResult,
        listenFor: const Duration(seconds: 5), // Listen for 5 seconds
        pauseFor: const Duration(seconds: 3), // Pause detection after 3 seconds of silence
      );
    } else {
      print("The user has denied the use of speech recognition.");
    }
  }

  void stopListening() async {
    await _speechToText.stop();
    if (!mounted) return;
    setState(() {
      _isListening = false;
    });
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    if (!mounted) return;
    setState(() {
      _lastWords = result.recognizedWords;
      if (result.finalResult) {
        _processVoiceCommand(_lastWords);
        _lastWords = ''; // Clear for next command
      }
    });
  }

  void _processVoiceCommand(String command) {
    print('Processing voice command: $command');
    final lowerCommand = command.toLowerCase();

    // Reset all filters before applying new ones from voice command
    _currentSearchQuery = '';
    _selectedPriceRange = PriceRange.all;
    _minCustomPrice = null;
    _maxCustomPrice = null;
    _selectedSize = null;

    if (lowerCommand.contains('vestidos') || lowerCommand.contains('vestido')) {
      _currentSearchQuery = 'vestido';
    } else if (lowerCommand.contains('faldas') || lowerCommand.contains('falda')) {
      _currentSearchQuery = 'falda';
    } else if (lowerCommand.contains('camisas') || lowerCommand.contains('camisa')) {
      _currentSearchQuery = 'camisa';
    } else if (lowerCommand.contains('recientes') || lowerCommand.contains('nuevo')) {
      // For 'recent products', we assume a sorting mechanism.
      // For now, we'll just search for 'nuevo' or 'reciente' in name/description.
      // A more robust solution would involve sorting the product list.
      _currentSearchQuery = 'nuevo'; // Example: search for 'new' in product description
    } else if (lowerCommand.contains('menos de 50') || lowerCommand.contains('menos cincuenta')) {
      _selectedPriceRange = PriceRange.under50;
    } else if (lowerCommand.contains('entre 50 y 100') || lowerCommand.contains('cincuenta y cien')) {
      _selectedPriceRange = PriceRange.fiftyTo100;
    } else if (lowerCommand.contains('mas de 100') || lowerCommand.contains('mas de cien')) {
      _selectedPriceRange = PriceRange.over100;
    } else if (lowerCommand.contains('talla pequeña') || lowerCommand.contains('talla s')) {
      _selectedSize = 'S';
    } else if (lowerCommand.contains('talla m') || lowerCommand.contains('talla mediana')) {
      _selectedSize = 'M';
    } else if (lowerCommand.contains('talla l') || lowerCommand.contains('talla grande')) {
      _selectedSize = 'L';
    } else if (lowerCommand.contains('todos') || lowerCommand.contains('limpiar filtros')) {
      // All filters are already reset at the beginning of this method.
    } else {
      _currentSearchQuery = lowerCommand; // If no specific command, treat as general search
    }

    _applyFilters(context.read<ProductProvider>().products);
  }

  void _applyFilters(List<Product> allProducts) {
    List<Product> tempFilteredProducts = allProducts;

    // Apply search query filter
    if (_currentSearchQuery.isNotEmpty) {
      tempFilteredProducts = tempFilteredProducts
          .where((product) =>
              product.name.toLowerCase().contains(_currentSearchQuery.toLowerCase()) ||
              (product.description?.toLowerCase() ?? '').contains(_currentSearchQuery.toLowerCase()))
          .toList();
    }

    // Apply price range filter
    switch (_selectedPriceRange) {
      case PriceRange.under50:
        tempFilteredProducts = tempFilteredProducts.where((product) => product.price < 50).toList();
        break;
      case PriceRange.fiftyTo100:
        tempFilteredProducts = tempFilteredProducts.where((product) => product.price >= 50 && product.price <= 100).toList();
        break;
      case PriceRange.over100:
        tempFilteredProducts = tempFilteredProducts.where((product) => product.price > 100).toList();
        break;
      case PriceRange.custom:
        tempFilteredProducts = tempFilteredProducts.where((product) {
          bool matchesMin = _minCustomPrice == null || product.price >= _minCustomPrice!;
          bool matchesMax = _maxCustomPrice == null || product.price <= _maxCustomPrice!;
          return matchesMin && matchesMax;
        }).toList();
        break;
      case PriceRange.all:
        // No price filter applied
        break;
    }

    // Apply size filter
    if (_selectedSize != null && _selectedSize != 'Todos') {
      tempFilteredProducts = tempFilteredProducts.where((product) =>
          product.size?.toLowerCase() == _selectedSize!.toLowerCase() &&
          (product.categoryName?.toLowerCase() == 'vestido' || product.categoryName?.toLowerCase() == 'ropa')).toList(); // Assuming 'vestido' or 'ropa' categories have sizes
    }

    setState(() {
      _filteredProducts = tempFilteredProducts;
    });
  }

  void updateSearchQuery(String query) {
    setState(() {
      _currentSearchQuery = query;
      _applyFilters(context.read<ProductProvider>().products);
    });
  }

  Future<void> _showCustomPriceRangeDialog() async {
    print('Opening custom price range dialog...');
    final result = await showDialog<Map<String, double>>(
      context: context,
      builder: (context) => PriceRangeDialog(
        minPrice: _minCustomPrice,
        maxPrice: _maxCustomPrice,
      ),
    );

    if (result != null) {
      print('Dialog returned result: $result');
      setState(() {
        _minCustomPrice = result['min'];
        _maxCustomPrice = result['max'];
        _selectedPriceRange = PriceRange.custom;
        _applyFilters(context.read<ProductProvider>().products);
      });
      print('Applied custom price filter: min=$_minCustomPrice, max=$_maxCustomPrice');
    } else {
      print('Dialog dismissed without applying. Reverting to all products.');
      setState(() {
        _selectedPriceRange = PriceRange.all;
        _minCustomPrice = null;
        _maxCustomPrice = null;
        _applyFilters(context.read<ProductProvider>().products);
      });
    }
  }

  Set<String> _getAvailableSizes(List<Product> products) {
    final Set<String> sizes = {'Todos'}; // Add 'Todos' as a default option
    for (var product in products) {
      if ((product.categoryName?.toLowerCase() == 'vestido' || product.categoryName?.toLowerCase() == 'ropa') && product.size != null) {
        sizes.add(product.size!);
      }
    }
    return sizes;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProductProvider>(
      builder: (context, provider, child) {
        if (provider.status == ProductStatus.success && _filteredProducts.isEmpty && _currentSearchQuery.isEmpty && _selectedPriceRange == PriceRange.all && _selectedSize == null) {
          _applyFilters(provider.products);
        }

        final List<Product> allProducts = provider.products;
        final Set<String> availableSizes = _getAvailableSizes(allProducts);
        final bool showSizeFilter = availableSizes.length > 1; // Show if more than just 'Todos' is available

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
            if (_filteredProducts.isEmpty && (_currentSearchQuery.isNotEmpty || _selectedPriceRange != PriceRange.all || _selectedSize != null)) {
              return const Center(child: Text('No se encontraron productos que coincidan con los filtros.'));
            }
            if (_filteredProducts.isEmpty && _currentSearchQuery.isEmpty && _selectedPriceRange == PriceRange.all && _selectedSize == null) {
              return const Center(child: Text('No se encontraron productos.'));
            }
            return Column(
              children: [
                GestureDetector(
                  onTap: () {
                    print('Tapped on price filter row area.');
                  },
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                    child: Row(
                      children: [
                        ChoiceChip(
                          label: const Text('Todos'),
                          selected: _selectedPriceRange == PriceRange.all,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedPriceRange = PriceRange.all;
                                _minCustomPrice = null;
                                _maxCustomPrice = null;
                                _applyFilters(provider.products);
                              });
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('< \$50'),
                          selected: _selectedPriceRange == PriceRange.under50,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedPriceRange = PriceRange.under50;
                                _minCustomPrice = null;
                                _maxCustomPrice = null;
                                _applyFilters(provider.products);
                              });
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('\$50 - \$100'),
                          selected: _selectedPriceRange == PriceRange.fiftyTo100,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedPriceRange = PriceRange.fiftyTo100;
                                _minCustomPrice = null;
                                _maxCustomPrice = null;
                                _applyFilters(provider.products);
                              });
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('> \$100'),
                          selected: _selectedPriceRange == PriceRange.over100,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedPriceRange = PriceRange.over100;
                                _minCustomPrice = null;
                                _maxCustomPrice = null;
                                _applyFilters(provider.products);
                              });
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Rango Personalizado'),
                          selected: _selectedPriceRange == PriceRange.custom,
                          onSelected: (selected) {
                            print('Rango Personalizado chip tapped. Selected: $selected');
                            if (selected) {
                              _showCustomPriceRangeDialog();
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                if (showSizeFilter) // Conditionally display size filter
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                    child: Row(
                      children: availableSizes.map((size) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4.0),
                          child: ChoiceChip(
                            label: Text(size),
                            selected: _selectedSize == size,
                            onSelected: (selected) {
                              setState(() {
                                _selectedSize = selected ? size : null;
                                _applyFilters(provider.products);
                              });
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () => provider.fetchAllProducts(),
                    child: GridView.builder(
                      padding: const EdgeInsets.all(8.0),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 8.0,
                        mainAxisSpacing: 8.0,
                        childAspectRatio: 0.75,
                      ),
                      itemCount: _filteredProducts.length,
                      itemBuilder: (context, index) {
                        final product = _filteredProducts[index];
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
                  ),
                ),
              ],
            );
          case ProductStatus.initial:
          default:
            return const Center(child: CircularProgressIndicator());
        }
      },
    );
  }
}
