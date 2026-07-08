import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../services/api_client.dart';

class SessionService extends ChangeNotifier {
  SessionService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;
  AppUser? _user;

  AppUser? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isPremium => _user?.isPremium ?? false;

  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString('user_email');
    final role = prefs.getString('user_role');
    final id = prefs.getInt('user_id');
    if (email != null && role != null && id != null) {
      _user = AppUser(id: id, email: email, role: role);
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final loggedIn = await _api.loginApp(email, password);
    _user = loggedIn;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_email', loggedIn.email);
    await prefs.setString('user_role', loggedIn.role);
    await prefs.setInt('user_id', loggedIn.id);
    notifyListeners();
  }

  Future<void> logout() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }

  ApiClient get api => _api;
}
