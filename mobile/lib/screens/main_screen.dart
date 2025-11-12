import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:mobile/providers/notification_provider.dart';
import 'package:mobile/screens/notification_screen.dart';
import 'package:mobile/services/local_notification_service.dart';
import 'package:mobile/models/notification.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/product_provider.dart'; // Import ProductProvider

import '../providers/cart_provider.dart';
import 'products/product_list_screen.dart';
import 'products/product_search_delegate.dart'; // Import ProductSearchDelegate
import 'cart/cart_screen.dart';
import 'profile/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ProductListScreenState> _productListKey = GlobalKey(); // Key for ProductListScreen

  void _navigateToProducts() {
    setState(() {
      _selectedIndex = 0; // Index for ProductListScreen
    });
  }

  late final List<Widget> _widgetOptions = <Widget>[
    ProductListScreen(key: _productListKey), // Pass key to ProductListScreen
    CartScreen(onNavigateToProducts: _navigateToProducts),
    const ProfileScreen(),
  ];

  static const List<String> _widgetTitles = <String>[
    'Boutique',
    'Carrito de Compras',
    'Mi Perfil',
  ];

  @override
  void initState() {
    super.initState();
    _setupFirebaseListeners();
  }

  void _setupFirebaseListeners() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      if (message.notification != null) {
        // Show local notification
        LocalNotificationService.showNotification(message);

        // Refetch notifications from the server to update the list
        Provider.of<NotificationProvider>(context, listen: false)
            .fetchNotifications();
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('App opened from background with message: ${message.data}');
      // Navigate to notifications screen when user taps notification
      Navigator.of(context).pushNamed(NotificationScreen.routeName);
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: Text(_widgetTitles.elementAt(_selectedIndex)),
        actions: [
          // Notification icon, always visible
          Consumer<NotificationProvider>(
            builder: (context, provider, child) {
              return IconButton(
                icon: Badge(
                  label: Text(provider.unreadCount.toString()),
                  isLabelVisible: provider.unreadCount > 0,
                  child: const Icon(Icons.notifications_outlined),
                ),
                onPressed: () {
                  Navigator.of(context).pushNamed(NotificationScreen.routeName);
                },
              );
            },
          ),
          // Search icon, visible only on Tienda tab
          if (_selectedIndex == 0) // Index for ProductListScreen
            IconButton(
              icon: const Icon(Icons.search),
              tooltip: 'Buscar Productos',
              onPressed: () async {
                final productProvider = Provider.of<ProductProvider>(context, listen: false);
                final String? selected = await showSearch<String>(
                  context: context,
                  delegate: ProductSearchDelegate(productProvider.products),
                );
                if (selected != null && selected.isNotEmpty) {
                  _productListKey.currentState?.updateSearchQuery(selected);
                }
              },
            ),
          // Microphone icon, visible only on Tienda tab
          if (_selectedIndex == 0) // Index for ProductListScreen
            IconButton(
              icon: const Icon(Icons.mic),
              tooltip: 'Búsqueda por Voz',
              onPressed: () {
                _productListKey.currentState?.startListening();
              },
            ),
          // Logout button, visible only on Profile tab
          if (_selectedIndex == 2) // Index for ProfileScreen
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Cerrar Sesión',
              onPressed: () {
                authProvider.logout();
              },
            ),
        ],
      ),
      body: Center(
        child: _widgetOptions.elementAt(_selectedIndex),
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: <BottomNavigationBarItem>[
          const BottomNavigationBarItem(
            icon: Icon(Icons.store),
            label: 'Tienda',
          ),
          BottomNavigationBarItem(
            icon: Consumer<CartProvider>(
              builder: (context, cart, child) {
                return Badge(
                  label: Text(cart.itemCount.toString()),
                  isLabelVisible: cart.itemCount > 0,
                  child: const Icon(Icons.shopping_cart),
                );
              },
            ),
            label: 'Carrito',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
      ),
    );
  }
}
