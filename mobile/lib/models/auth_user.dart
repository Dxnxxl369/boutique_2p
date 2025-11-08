class AuthUser {
  const AuthUser({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      phone: json['phone'] as String?,
    );
  }

  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? phone;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'username': username,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'role': role,
      'phone': phone,
    };
  }

  String get fullName {
    final parts = [firstName, lastName].where((part) => part.trim().isNotEmpty);
    return parts.isEmpty ? username : parts.join(' ');
  }
}
