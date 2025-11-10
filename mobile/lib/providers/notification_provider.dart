import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';
import '../models/notification.dart';
import 'auth_provider.dart';

class NotificationProvider extends ChangeNotifier {
  final AuthProvider _authProvider;
  final NotificationService _notificationService = NotificationService();
  
  List<BoutiqueNotification> _notifications = [];
  bool _isLoading = false;
  String? _error;

  NotificationProvider({required AuthProvider authProvider}) : _authProvider = authProvider {
    // Listen to auth changes to fetch notifications when user logs in
    _authProvider.addListener(_onAuthChanged);
    _onAuthChanged(); // Initial check
  }

  List<BoutiqueNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void _onAuthChanged() {
    if (_authProvider.isAuthenticated) {
      fetchNotifications();
    } else {
      _notifications = [];
      notifyListeners();
    }
  }

  Future<void> fetchNotifications() async {
    if (_authProvider.accessToken == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _notifications = await _notificationService.getNotifications(_authProvider.accessToken!);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void addNotification(BoutiqueNotification notification) {
    _notifications.insert(0, notification);
    notifyListeners();
  }

  Future<void> markAllAsRead() async {
    if (_authProvider.accessToken == null) return;

    try {
      await _notificationService.markAllAsRead(_authProvider.accessToken!);
      // Optimistically update the UI
      _notifications = _notifications.map((n) => n..isRead = true).toList();
      notifyListeners();
    } catch (e) {
      print("Error marking all as read: $e");
      // Optionally revert optimistic update
    }
  }

  @override
  void dispose() {
    _authProvider.removeListener(_onAuthChanged);
    super.dispose();
  }
}
