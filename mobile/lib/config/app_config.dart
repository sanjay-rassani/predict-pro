import 'package:flutter/material.dart';

import 'package:flutter/foundation.dart';

class AppConfig {
  static String get apiBaseUrl => _resolveBaseUrl(
        const String.fromEnvironment('API_BASE_URL'),
        defaultAndroid: 'http://10.0.2.2:3001',
      );

  static String get wsBaseUrl => _resolveBaseUrl(
        const String.fromEnvironment('WS_BASE_URL'),
        defaultAndroid: 'http://10.0.2.2:3001',
      );

  static String _resolveBaseUrl(String fromEnv, {required String defaultAndroid}) {
    if (fromEnv.isNotEmpty) return _normalizeUrl(fromEnv);
    if (kIsWeb) return 'http://localhost:3001';
    if (defaultTargetPlatform == TargetPlatform.android) return defaultAndroid;
    return 'http://localhost:3001';
  }

  /// Ensures dart-define values like `localhost:3001` still work.
  static String _normalizeUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return 'http://$trimmed';
  }
}

class AppColors {
  static const purple = Color(0xFF6A0DAD);
  static const background = Color(0xFF0D0D0F);
  static const surface = Color(0xFF1A1A1F);
  static const card = Color(0xFF242429);
  static const win = Color(0xFF22C55E);
  static const loss = Color(0xFFEF4444);
}
