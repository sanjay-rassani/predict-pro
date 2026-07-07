import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_client.dart';

class NotificationService extends ChangeNotifier {
  NotificationService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;
  final _random = Random();
  String? _registeredToken;
  SignalApprovedEvent? _pendingAlert;

  SignalApprovedEvent? get pendingAlert => _pendingAlert;
  String? get registeredToken => _registeredToken;

  Future<void> registerForPush(AppUser user) async {
    if (!user.isPremium) return;
    final token = _buildDevToken(user);
    await _api.registerDeviceToken(email: user.email, token: token, platform: _platformName());
    _registeredToken = token;
    notifyListeners();
  }

  void handleSignalApproved(SignalApprovedEvent event) {
    _pendingAlert = event;
    notifyListeners();
  }

  void clearPendingAlert() {
    _pendingAlert = null;
    notifyListeners();
  }

  String _buildDevToken(AppUser user) {
    final suffix = _random.nextInt(999999).toString().padLeft(6, '0');
    return 'dev-${user.id}-$_platformName-$suffix';
  }

  String _platformName() {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      default:
        return 'desktop';
    }
  }
}
