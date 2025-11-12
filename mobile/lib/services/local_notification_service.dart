import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static void initialize() {
    // Initialization settings for Android
    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      // Add iOS settings if needed
    );

    _notificationsPlugin.initialize(
      initializationSettings,
      // onDidReceiveNotificationResponse: (details) {
      //   // Handle notification tap when app is in the foreground
      //   print('Notification tapped: ${details.payload}');
      // },
    );
  }

  static void showNotification(RemoteMessage message) {
    // Create a notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description: 'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    final RemoteNotification? notification = message.notification;
    final AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      // Extract data from the message payload
      final String? orderId = message.data['order_id'];
      final String? newStatus = message.data['new_status'];

      int notificationId = notification.hashCode; // Fallback
      if (orderId != null && newStatus != null) {
        // Create a unique ID based on orderId and newStatus
        // Using a simple hash for newStatus, could be more robust if needed
        notificationId = int.parse(orderId) * 1000 + newStatus.hashCode;
      }

      _notificationsPlugin.show(
        notificationId, // Use the unique ID
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            channel.id,
            channel.name,
            channelDescription: channel.description,
            icon: android.smallIcon,
            // other properties...
          ),
        ),
      );
    }
  }
}
