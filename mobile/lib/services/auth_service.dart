import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/auth_user.dart';

class AuthService {
  AuthService({http.Client? client}) : _client = client ?? http.Client();

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user';

  final http.Client _client;

  Future<AuthSession> login({
    required String username,
    required String password,
  }) async {
    final uri = Uri.parse('$kApiBaseUrl$kAuthLoginPath');
    final response = await _client.post(
      uri,
      headers: _defaultHeaders,
      body: jsonEncode(<String, String>{
        'username': username.trim(),
        'password': password,
      }),
    );

    return _handleAuthResponse(response);
  }

  Future<AuthSession> register({
    required String username,
    required String email,
    required String password,
    required String passwordConfirm,
    String firstName = '',
    String lastName = '',
    String role = 'user',
    String? phone,
  }) async {
    final uri = Uri.parse('$kApiBaseUrl$kAuthRegisterPath');
    final response = await _client.post(
      uri,
      headers: _defaultHeaders,
      body: jsonEncode(<String, dynamic>{
        'username': username.trim(),
        'email': email.trim(),
        'password': password,
        'password_confirm': passwordConfirm,
        'first_name': firstName.trim(),
        'last_name': lastName.trim(),
        'role': role,
        'phone': phone?.trim(),
      }),
    );

    return _handleAuthResponse(response, expectedStatus: 201);
  }

  Future<AuthUser> fetchCurrentUser(String accessToken) async {
    final uri = Uri.parse('$kApiBaseUrl$kAuthCurrentUserPath');
    final response = await _client.get(
      uri,
      headers: <String, String>{
        ..._defaultHeaders,
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> payload =
          jsonDecode(response.body) as Map<String, dynamic>;
      return AuthUser.fromJson(payload);
    }

    throw AuthException(_mapErrorMessage(response));
  }

  Future<void> logout(String refreshToken) async {
    final uri = Uri.parse('$kApiBaseUrl$kAuthLogoutPath');
    final response = await _client.post(
      uri,
      headers: _defaultHeaders,
      body: jsonEncode(<String, dynamic>{'refresh': refreshToken}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    throw AuthException(_mapErrorMessage(response));
  }

  AuthSession _handleAuthResponse(
    http.Response response, {
    int expectedStatus = 200,
  }) {
    if (response.statusCode != expectedStatus) {
      throw AuthException(_mapErrorMessage(response));
    }

    final Map<String, dynamic> payload =
        jsonDecode(response.body) as Map<String, dynamic>;

    final userData = payload['user'] as Map<String, dynamic>?;
    if (userData == null) {
      throw const AuthException('Respuesta inesperada del servidor');
    }

    final user = AuthUser.fromJson(userData);
    final access = payload['access'] as String?;
    final refresh = payload['refresh'] as String?;

    if (access == null || refresh == null) {
      throw const AuthException('Tokens de autenticación faltantes');
    }

    return AuthSession(
      user: user,
      accessToken: access,
      refreshToken: refresh,
    );
  }

  Map<String, String> get _defaultHeaders => const <String, String>{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  String _mapErrorMessage(http.Response response) {
    try {
      final Map<String, dynamic> payload =
          jsonDecode(response.body) as Map<String, dynamic>;
      if (payload.containsKey('error')) {
        return payload['error'] as String? ?? 'Ocurrió un error inesperado';
      }
      if (payload.containsKey('detail')) {
        return payload['detail'] as String? ?? 'Solicitud inválida';
      }
      if (payload.isNotEmpty) {
        return payload.values.first.toString();
      }
    } catch (_) {
      // Ignore parsing errors and fall back to generic message.
    }
    return 'No se pudo completar la solicitud (${response.statusCode}).';
  }

  static const storageAccessTokenKey = _accessTokenKey;
  static const storageRefreshTokenKey = _refreshTokenKey;
  static const storageUserKey = _userKey;

  void dispose() {
    _client.close();
  }
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final AuthUser user;
  final String accessToken;
  final String refreshToken;
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => 'AuthException: $message';
}
