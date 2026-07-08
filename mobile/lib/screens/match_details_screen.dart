import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../providers/live_scores_notifier.dart';
import '../services/api_client.dart';
import '../widgets/common_widgets.dart';

class MatchDetailsScreen extends StatefulWidget {
  const MatchDetailsScreen({super.key, required this.match});

  final MatchModel match;

  @override
  State<MatchDetailsScreen> createState() => _MatchDetailsScreenState();
}

class _MatchDetailsScreenState extends State<MatchDetailsScreen> {
  final _api = ApiClient();
  List<PredictionModel> _predictions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.getPredictions(query: {
        'match_id': '${widget.match.id}',
        'publish_status': 'published',
      });
      if (!mounted) return;
      setState(() => _predictions = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _statusLabel(MatchModel m) {
    if (m.isLive && m.currentMinute != null) return "LIVE · ${m.currentMinute}'";
    switch (m.matchStatus) {
      case 'HT':
        return 'Half Time';
      case 'FT':
        return 'Full Time';
      case 'NS':
      case null:
        return 'Not Started';
      default:
        return m.matchStatus!;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Prefer the live-updating copy from the notifier so scores stay real-time.
    final live = context.watch<LiveScoresNotifier>();
    final match = live.getMatch(widget.match.id) ?? widget.match;
    final standings = live.standingsForLeague(match.league);
    final kickoff = DateFormat('EEE, d MMM · HH:mm').format(match.matchDatetime.toLocal());

    return Scaffold(
      appBar: AppBar(title: const Text('Match Details')),
      body: RefreshIndicator(
        color: AppColors.purple,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            _HeaderCard(match: match, statusLabel: _statusLabel(match), kickoff: kickoff),
            _InfoSection(match: match, kickoff: kickoff),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Predictions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: AppColors.purple)),
              )
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton(onPressed: _load, child: const Text('Retry')),
                  ],
                ),
              )
            else if (_predictions.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No predictions published for this match yet',
                    style: TextStyle(color: Colors.white54)),
              )
            else
              for (final p in _predictions) _PredictionRow(prediction: p),
            if (standings.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Text('Standings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    for (final row in standings.take(10))
                      ListTile(
                        dense: true,
                        leading: SizedBox(
                          width: 24,
                          child: Text('${row['rank'] ?? ''}',
                              style: const TextStyle(color: Colors.white54)),
                        ),
                        title: Text(row['team']?['name']?.toString() ?? '',
                            style: const TextStyle(fontSize: 13)),
                        trailing: Text('${row['points'] ?? ''} pts',
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.match, required this.statusLabel, required this.kickoff});

  final MatchModel match;
  final String statusLabel;
  final String kickoff;

  @override
  Widget build(BuildContext context) {
    final showScore = match.isLive || match.matchStatus == 'FT' || match.matchStatus == 'HT';
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        child: Column(
          children: [
            Text(match.league,
                style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6))),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      TeamLogo(url: match.homeTeamLogoUrl, size: 44),
                      const SizedBox(height: 8),
                      Text(match.homeTeam,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                Column(
                  children: [
                    Text(
                      showScore ? '${match.homeScore ?? 0} - ${match.awayScore ?? 0}' : 'VS',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: match.isLive
                            ? AppColors.purple.withValues(alpha: 0.25)
                            : Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(statusLabel,
                          style: TextStyle(
                              fontSize: 11,
                              color: match.isLive ? AppColors.purple : Colors.white70)),
                    ),
                  ],
                ),
                Expanded(
                  child: Column(
                    children: [
                      TeamLogo(url: match.awayTeamLogoUrl, size: 44),
                      const SizedBox(height: 8),
                      Text(match.awayTeam,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({required this.match, required this.kickoff});

  final MatchModel match;
  final String kickoff;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          _InfoRow(icon: Icons.schedule, label: 'Kick-off', value: kickoff),
          const Divider(height: 1),
          _InfoRow(icon: Icons.emoji_events_outlined, label: 'League', value: match.league),
          if (match.market != null && match.market!.isNotEmpty) ...[
            const Divider(height: 1),
            _InfoRow(icon: Icons.category_outlined, label: 'Category', value: match.market!),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Icon(icon, size: 20, color: Colors.white54),
      title: Text(label, style: const TextStyle(fontSize: 13, color: Colors.white54)),
      trailing: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
    );
  }
}

class _PredictionRow extends StatelessWidget {
  const _PredictionRow({required this.prediction});

  final PredictionModel prediction;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.purple.withValues(alpha: 0.25),
          child: Text(prediction.predictedValue.isNotEmpty
              ? prediction.predictedValue[0].toUpperCase()
              : '?'),
        ),
        title: Text('${prediction.type} · ${prediction.predictedValue}'),
        subtitle: Text(prediction.oddsDisplay != null
            ? 'Odds @ ${prediction.oddsDisplay!.toStringAsFixed(2)}'
            : 'No odds'),
        trailing: ResultBadge(status: prediction.resultStatus),
      ),
    );
  }
}
