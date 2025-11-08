import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_user.dart';
import '../services/auth_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider({AuthService? service}) : _service = service ?? AuthService();

  final AuthService _service;

  AuthStatus _status = AuthStatus.initial;
  AuthUser? _currentUser;
  String? _accessToken;
  String? _refreshToken;
  String? _errorMessage;
  bool _isBusy = false;

  AuthStatus get status => _status;
  AuthUser? get user => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isBusy => _isBusy;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;

  Future<void> initialize() async {
    if (_status != AuthStatus.initial) {
      return;
    }

    _status = AuthStatus.loading;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final access = prefs.getString(AuthService.storageAccessTokenKey);
    final refresh = prefs.getString(AuthService.storageRefreshTokenKey);
    final userJson = prefs.getString(AuthService.storageUserKey);

    if (access == null || refresh == null || userJson == null) {
      await _clearStoredSession(prefs);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    try {
      final Map<String, dynamic> decoded =
          jsonDecode(userJson) as Map<String, dynamic>;
      final localUser = AuthUser.fromJson(decoded);
      _currentUser = localUser;
      _accessToken = access;
      _refreshToken = refresh;

      final remoteUser = await _service.fetchCurrentUser(access);
      _currentUser = remoteUser;
      await prefs.setString(
        AuthService.storageUserKey,
        jsonEncode(remoteUser.toJson()),
      );
      _status = AuthStatus.authenticated;
    } catch (_) {
      await _clearStoredSession(prefs);
      _status = AuthStatus.unauthenticated;
    }

    notifyListeners();
  }

  Future<bool> login({
    required String username,
    required String password,
  }) async {
    _errorMessage = null;
    _setBusy(true);

    try {
      final session = await _service.login(
        username: username,
        password: password,
      );
      await _persistSession(session);
      _status = AuthStatus.authenticated;
      _currentUser = session.user;
      _accessToken = session.accessToken;
      _refreshToken = session.refreshToken;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = error.message;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<bool> register({
    required String username,
    required String email,
    required String password,
    required String passwordConfirm,
    String firstName = '',
    String lastName = '',
    String role = 'user',
    String? phone,
  }) async {
    _errorMessage = null;
    _setBusy(true);

    try {
      final session = await _service.register(
        username: username,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
        firstName: firstName,
        lastName: lastName,
        role: role,
        phone: phone,
      );
      await _persistSession(session);
      _status = AuthStatus.authenticated;
      _currentUser = session.user;
      _accessToken = session.accessToken;
      _refreshToken = session.refreshToken;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = error.message;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> logout() async {
    final refresh = _refreshToken;
    _errorMessage = null;
    _setBusy(true);

    try {
      if (refresh != null && refresh.isNotEmpty) {
        await _service.logout(refresh);
      }
    } on AuthException catch (error) {
      _errorMessage = error.message;
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await _clearStoredSession(prefs);
      _currentUser = null;
      _accessToken = null;
      _refreshToken = null;
      _status = AuthStatus.unauthenticated;
      _setBusy(false);
      notifyListeners();
    }
  }

  Future<void> _persistSession(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      AuthService.storageAccessTokenKey,
      session.accessToken,
    );
    await prefs.setString(
      AuthService.storageRefreshTokenKey,
      session.refreshToken,
    );
    await prefs.setString(
      AuthService.storageUserKey,
      jsonEncode(session.user.toJson()),
    );
  }

  Future<void> _clearStoredSession(SharedPreferences prefs) async {
    await prefs.remove(AuthService.storageAccessTokenKey);
    await prefs.remove(AuthService.storageRefreshTokenKey);
    await prefs.remove(AuthService.storageUserKey);
  }

  void _setBusy(bool value) {
    if (_isBusy != value) {
      _isBusy = value;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _service.dispose();
    super.dispose();
  }
}
