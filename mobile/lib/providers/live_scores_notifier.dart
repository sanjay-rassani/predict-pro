import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';

class LiveScoresNotifier extends ChangeNotifier {
  LiveScoresNotifier({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;
  SocketService? _socket;

  final Map<int, MatchModel> _matches = {};
  bool loading = false;
  String? error;

  List<MatchModel> get allMatches =>
      _matches.values.toList()..sort((a, b) => a.matchDatetime.compareTo(b.matchDatetime));

  List<MatchModel> get liveMatches => allMatches.where((m) => m.isLive).toList();

  List<MatchModel> get upcomingMatches =>
      allMatches.where((m) => !m.isLive && m.matchStatus != 'FT').toList();

  List<String> get categories {
    final markets = allMatches.map((m) => m.market).whereType<String>().where((m) => m.isNotEmpty);
    return markets.toSet().toList()..sort();
  }

  MatchModel? getMatch(int id) => _matches[id];

  Future<void> load({Map<String, String>? query}) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final list = await _api.getMatches(query: query);
      _matches
        ..clear()
        ..addEntries(list.map((m) => MapEntry(m.id, m)));
      error = null;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void connectSocket(String role) {
    _socket?.disconnect();
    _socket = SocketService(onLiveScore: _onLiveScore);
    _socket!.connect(role: role);
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket = null;
  }

  void _onLiveScore(LiveScoreUpdate update) {
    final existing = _matches[update.matchId];
    if (existing == null) {
      _matches[update.matchId] = MatchModel(
        id: update.matchId,
        homeTeam: update.homeTeam,
        awayTeam: update.awayTeam,
        league: '',
        matchDatetime: DateTime.now(),
        published: true,
        homeScore: update.homeScore,
        awayScore: update.awayScore,
        currentMinute: update.currentMinute,
        matchStatus: update.matchStatus,
      );
    } else {
      _matches[update.matchId] = MatchModel(
        id: existing.id,
        homeTeam: update.homeTeam.isNotEmpty ? update.homeTeam : existing.homeTeam,
        awayTeam: update.awayTeam.isNotEmpty ? update.awayTeam : existing.awayTeam,
        league: existing.league,
        market: existing.market,
        matchDatetime: existing.matchDatetime,
        published: existing.published,
        homeScore: update.homeScore,
        awayScore: update.awayScore,
        currentMinute: update.currentMinute,
        matchStatus: update.matchStatus,
        homeTeamLogoUrl: existing.homeTeamLogoUrl,
        awayTeamLogoUrl: existing.awayTeamLogoUrl,
        standingsData: existing.standingsData,
      );
    }
    notifyListeners();
  }

  List<Map<String, dynamic>> standingsForLeague(String league) {
    for (final m in allMatches) {
      if (m.league == league && m.standingsData is List) {
        return (m.standingsData as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }
    }
    return [];
  }

  @override
  void dispose() {
    disconnectSocket();
    super.dispose();
  }
}
