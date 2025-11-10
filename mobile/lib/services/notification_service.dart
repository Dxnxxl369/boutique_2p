import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/notification.dart';

class NotificationService {
  Future<List<BoutiqueNotification>> getNotifications(String token) async {
    final uri = Uri.parse('$kApiBaseUrl/notifications/');
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(utf8.decode(response.bodyBytes));
      return data.map((json) => BoutiqueNotification.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load notifications');
    }
  }

  Future<void> markAllAsRead(String token) async {
    final uri = Uri.parse('$kApiBaseUrl/notifications/mark_all_as_read/');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to mark notifications as read');
    }
  }
}
