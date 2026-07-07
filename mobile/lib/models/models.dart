class AppUser {
  final int id;
  final String email;
  final String role;

  const AppUser({required this.id, required this.email, required this.role});

  bool get isPremium => role == 'premium';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int,
      email: json['email'] as String,
      role: json['role'] as String,
    );
  }
}

class MatchModel {
  final int id;
  final String homeTeam;
  final String awayTeam;
  final String league;
  final String? market;
  final DateTime matchDatetime;
  final bool published;
  final int? homeScore;
  final int? awayScore;
  final int? currentMinute;
  final String? matchStatus;
  final String? homeTeamLogoUrl;
  final String? awayTeamLogoUrl;
  final dynamic standingsData;

  const MatchModel({
    required this.id,
    required this.homeTeam,
    required this.awayTeam,
    required this.league,
    this.market,
    required this.matchDatetime,
    required this.published,
    this.homeScore,
    this.awayScore,
    this.currentMinute,
    this.matchStatus,
    this.homeTeamLogoUrl,
    this.awayTeamLogoUrl,
    this.standingsData,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    return MatchModel(
      id: json['id'] as int,
      homeTeam: json['home_team'] as String,
      awayTeam: json['away_team'] as String,
      league: json['league'] as String,
      market: json['market'] as String?,
      matchDatetime: DateTime.parse(json['match_datetime'] as String),
      published: json['published'] as bool? ?? false,
      homeScore: json['home_score'] as int?,
      awayScore: json['away_score'] as int?,
      currentMinute: json['current_minute'] as int?,
      matchStatus: json['match_status'] as String?,
      homeTeamLogoUrl: json['home_team_logo_url'] as String?,
      awayTeamLogoUrl: json['away_team_logo_url'] as String?,
      standingsData: json['standings_data'],
    );
  }

  bool get isLive {
    const live = {'1H', '2H', 'HT', 'ET', 'P', 'LIVE'};
    return live.contains(matchStatus);
  }
}

class PredictionModel {
  final int id;
  final int matchId;
  final String type;
  final String predictedValue;
  final double? odds;
  final double? oddsDisplay;
  final String? resultStatus;
  final String? homeTeam;
  final String? awayTeam;
  final String? league;

  const PredictionModel({
    required this.id,
    required this.matchId,
    required this.type,
    required this.predictedValue,
    this.odds,
    this.oddsDisplay,
    this.resultStatus,
    this.homeTeam,
    this.awayTeam,
    this.league,
  });

  factory PredictionModel.fromJson(Map<String, dynamic> json) {
    return PredictionModel(
      id: json['id'] as int,
      matchId: json['match_id'] as int,
      type: json['type'] as String,
      predictedValue: json['predicted_value'] as String,
      odds: _toDouble(json['odds']),
      oddsDisplay: _toDouble(json['odds_display'] ?? json['odds']),
      resultStatus: json['result_status'] as String?,
      homeTeam: json['home_team'] as String?,
      awayTeam: json['away_team'] as String?,
      league: json['league'] as String?,
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

class NewsArticle {
  final int id;
  final String title;
  final String body;
  final String? imageUrl;
  final String category;
  final DateTime createdAt;

  const NewsArticle({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl,
    required this.category,
    required this.createdAt,
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    return NewsArticle(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
      imageUrl: json['image_url'] as String?,
      category: json['category'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class LiveOddsUpdate {
  final int matchId;
  final Map<String, double> values;
  final String? bookmaker;
  final String? market;
  final DateTime? updatedAt;

  const LiveOddsUpdate({
    required this.matchId,
    required this.values,
    this.bookmaker,
    this.market,
    this.updatedAt,
  });

  factory LiveOddsUpdate.fromJson(Map<String, dynamic> json) {
    final liveOdds = json['liveOdds'] as Map<String, dynamic>? ?? {};
    final rawValues = liveOdds['values'] as Map<String, dynamic>? ?? {};
    final values = <String, double>{};
    rawValues.forEach((key, value) {
      if (value is num) {
        values[key] = value.toDouble();
      } else {
        final parsed = double.tryParse(value.toString());
        if (parsed != null) values[key] = parsed;
      }
    });

    return LiveOddsUpdate(
      matchId: json['matchId'] as int,
      values: values,
      bookmaker: liveOdds['bookmaker'] as String?,
      market: liveOdds['market'] as String?,
      updatedAt: liveOdds['updatedAt'] != null
          ? DateTime.tryParse(liveOdds['updatedAt'] as String)
          : null,
    );
  }
}

class SignalApprovedEvent {
  final int predictionId;
  final int matchId;
  final String type;
  final String predictedValue;
  final String? homeTeam;
  final String? awayTeam;
  final String? league;

  const SignalApprovedEvent({
    required this.predictionId,
    required this.matchId,
    required this.type,
    required this.predictedValue,
    this.homeTeam,
    this.awayTeam,
    this.league,
  });

  factory SignalApprovedEvent.fromJson(Map<String, dynamic> json) {
    return SignalApprovedEvent(
      predictionId: json['predictionId'] as int,
      matchId: json['matchId'] as int,
      type: json['type'] as String,
      predictedValue: json['predictedValue'] as String,
      homeTeam: json['homeTeam'] as String?,
      awayTeam: json['awayTeam'] as String?,
      league: json['league'] as String?,
    );
  }

  String get title => 'New $type signal';
  String get body => '${homeTeam ?? 'Match'}: $predictedValue';
}

class SignalTypeStats {
  final int total;
  final int wins;
  final int losses;
  final int? successRate;

  const SignalTypeStats({
    required this.total,
    required this.wins,
    required this.losses,
    this.successRate,
  });

  factory SignalTypeStats.fromJson(Map<String, dynamic> json) {
    return SignalTypeStats(
      total: json['total'] as int? ?? 0,
      wins: json['wins'] as int? ?? 0,
      losses: json['losses'] as int? ?? 0,
      successRate: json['successRate'] as int?,
    );
  }
}

class SignalAnalytics {
  final List<PredictionModel> signals;
  final int total;
  final int wins;
  final int losses;
  final int? successRate;
  final Map<String, SignalTypeStats> byType;

  const SignalAnalytics({
    required this.signals,
    required this.total,
    required this.wins,
    required this.losses,
    this.successRate,
    required this.byType,
  });

  factory SignalAnalytics.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] as Map<String, dynamic>? ?? {};
    final signalsJson = json['signals'] as List<dynamic>? ?? [];
    final byTypeJson = summary['byType'] as Map<String, dynamic>? ?? {};

    return SignalAnalytics(
      signals: signalsJson
          .map((e) => PredictionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: summary['total'] as int? ?? 0,
      wins: summary['wins'] as int? ?? 0,
      losses: summary['losses'] as int? ?? 0,
      successRate: summary['successRate'] as int?,
      byType: byTypeJson.map(
        (key, value) => MapEntry(key, SignalTypeStats.fromJson(value as Map<String, dynamic>)),
      ),
    );
  }
}

class LiveScoreUpdate {
  final int matchId;
  final int homeScore;
  final int awayScore;
  final int? currentMinute;
  final String? matchStatus;
  final String homeTeam;
  final String awayTeam;

  LiveScoreUpdate({
    required this.matchId,
    required this.homeScore,
    required this.awayScore,
    this.currentMinute,
    this.matchStatus,
    required this.homeTeam,
    required this.awayTeam,
  });

  factory LiveScoreUpdate.fromJson(Map<String, dynamic> json) {
    return LiveScoreUpdate(
      matchId: json['matchId'] as int,
      homeScore: json['homeScore'] as int? ?? 0,
      awayScore: json['awayScore'] as int? ?? 0,
      currentMinute: json['currentMinute'] as int?,
      matchStatus: json['matchStatus'] as String?,
      homeTeam: json['homeTeam'] as String? ?? '',
      awayTeam: json['awayTeam'] as String? ?? '',
    );
  }
}
