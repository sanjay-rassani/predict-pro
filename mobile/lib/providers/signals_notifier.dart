import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';

class SignalsNotifier extends ChangeNotifier {
  SignalsNotifier({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;
  SocketService? _socket;
  final Map<int, LiveOddsUpdate> _liveOddsByMatch = {};

  List<PredictionModel> _surpriseSignals = [];
  List<PredictionModel> _comebackSignals = [];
  SignalAnalytics? _analytics;
  bool loadingSurprise = false;
  bool loadingComeback = false;
  bool loadingAnalytics = false;
  String? surpriseError;
  String? comebackError;
  String? analyticsError;
  SignalApprovedEvent? latestPush;

  List<PredictionModel> get surpriseSignals => _surpriseSignals;
  List<PredictionModel> get comebackSignals => _comebackSignals;
  SignalAnalytics? get analytics => _analytics;
  Map<int, LiveOddsUpdate> get liveOddsByMatch => Map.unmodifiable(_liveOddsByMatch);

  LiveOddsUpdate? oddsForMatch(int matchId) => _liveOddsByMatch[matchId];

  void connectSocket(String role) {
    _socket?.disconnect();
    _socket = SocketService(
      onLiveOdds: _onLiveOdds,
      onSignalApproved: _onSignalApproved,
    );
    _socket!.connect(role: role);
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket = null;
  }

  Future<void> loadSurpriseSignals() async {
    loadingSurprise = true;
    surpriseError = null;
    notifyListeners();
    try {
      _surpriseSignals = await _api.getPredictions(query: {
        'type': 'Surprise',
        'publish_status': 'published',
        'approval_status': 'approved',
      });
      _subscribeMatchOdds(_surpriseSignals);
    } catch (e) {
      surpriseError = e.toString();
    } finally {
      loadingSurprise = false;
      notifyListeners();
    }
  }

  Future<void> loadComebackSignals() async {
    loadingComeback = true;
    comebackError = null;
    notifyListeners();
    try {
      _comebackSignals = await _api.getPredictions(query: {
        'type': 'Comeback',
        'publish_status': 'published',
        'approval_status': 'approved',
      });
      _subscribeMatchOdds(_comebackSignals);
    } catch (e) {
      comebackError = e.toString();
    } finally {
      loadingComeback = false;
      notifyListeners();
    }
  }

  Future<void> loadAnalytics({String? period, String? league}) async {
    loadingAnalytics = true;
    analyticsError = null;
    notifyListeners();
    try {
      _analytics = await _api.getSignalAnalytics(period: period, league: league);
    } catch (e) {
      analyticsError = e.toString();
    } finally {
      loadingAnalytics = false;
      notifyListeners();
    }
  }

  void _subscribeMatchOdds(List<PredictionModel> signals) {
    if (_socket == null) return;
    final matchIds = signals.map((s) => s.matchId).toSet();
    for (final id in matchIds) {
      _socket!.joinMatch(id);
    }
  }

  void _onLiveOdds(LiveOddsUpdate update) {
    _liveOddsByMatch[update.matchId] = update;
    notifyListeners();
  }

  void _onSignalApproved(SignalApprovedEvent event) {
    latestPush = event;
    notifyListeners();
    loadSurpriseSignals();
    loadComebackSignals();
  }

  void clearLatestPush() {
    latestPush = null;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnectSocket();
    super.dispose();
  }
}
