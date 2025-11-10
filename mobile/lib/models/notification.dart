class BoutiqueNotification {
  final int id;
  final String message;
  final String notificationType;
  bool isRead;
  final DateTime createdAt;

  BoutiqueNotification({
    required this.id,
    required this.message,
    required this.notificationType,
    required this.isRead,
    required this.createdAt,
  });

  factory BoutiqueNotification.fromJson(Map<String, dynamic> json) {
    return BoutiqueNotification(
      id: json['id'],
      message: json['message'],
      notificationType: json['notification_type'],
      isRead: json['is_read'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
