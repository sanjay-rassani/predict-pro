import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  final String? code;

  ApiException(this.message, {this.code});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({String? baseUrl}) : _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final String _baseUrl;

  Future<Map<String, dynamic>> _get(String path) async {
    final res = await _request(() => http.get(Uri.parse('$_baseUrl$path')));
    return _decode(res);
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final res = await _request(
      () => http.post(
        Uri.parse('$_baseUrl$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ),
    );
    return _decode(res);
  }

  Future<http.Response> _request(Future<http.Response> Function() send) async {
    try {
      return await send();
    } on http.ClientException {
      throw ApiException('Unable to reach the API. Is the backend running?');
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  Map<String, dynamic> _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final map = body is Map<String, dynamic> ? body : <String, dynamic>{};
      throw ApiException(
        map['error']?.toString() ?? 'Request failed',
        code: map['code']?.toString(),
      );
    }
    return body as Map<String, dynamic>;
  }

  Future<AppUser> loginApp(String email) async {
    final json = await _post('/auth/app/login', {'email': email});
    return AppUser.fromJson(json['user'] as Map<String, dynamic>);
  }

  Future<List<MatchModel>> getMatches({Map<String, String>? query}) async {
    final q = query != null && query.isNotEmpty
        ? '?${Uri(queryParameters: query).query}'
        : '';
    final json = await _get('/matches$q');
    final list = json['data'] as List<dynamic>;
    return list.map((e) => MatchModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<PredictionModel>> getPredictions({Map<String, String>? query}) async {
    final q = query != null && query.isNotEmpty
        ? '?${Uri(queryParameters: query).query}'
        : '';
    final json = await _get('/predictions$q');
    final list = json['data'] as List<dynamic>;
    return list.map((e) => PredictionModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<NewsArticle>> getNews() async {
    final json = await _get('/news');
    final list = json['data'] as List<dynamic>;
    return list.map((e) => NewsArticle.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SignalAnalytics> getSignalAnalytics({String? period, String? league}) async {
    final params = <String, String>{};
    if (period != null && period.isNotEmpty) params['period'] = period;
    if (league != null && league.isNotEmpty) params['league'] = league;
    final q = params.isNotEmpty ? '?${Uri(queryParameters: params).query}' : '';
    final json = await _get('/analytics/signals$q');
    return SignalAnalytics.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> registerDeviceToken({
    required String email,
    required String token,
    required String platform,
  }) async {
    await _post('/notifications/register', {
      'email': email,
      'token': token,
      'platform': platform,
    });
  }
}
