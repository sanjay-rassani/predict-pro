import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../providers/live_scores_notifier.dart';
import '../widgets/common_widgets.dart';
import 'match_details_screen.dart';

class LiveScoresScreen extends StatefulWidget {
  const LiveScoresScreen({super.key, this.onRefresh});

  final Future<void> Function()? onRefresh;

  @override
  State<LiveScoresScreen> createState() => _LiveScoresScreenState();
}

class _LiveScoresScreenState extends State<LiveScoresScreen> {
  String? _selectedLeague;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<LiveScoresNotifier>().allMatches.isEmpty) {
        context.read<LiveScoresNotifier>().load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final live = context.watch<LiveScoresNotifier>();
    final matches = live.liveMatches.isNotEmpty ? live.liveMatches : live.allMatches.where((m) => m.isLive || m.matchStatus == 'FT').toList();
    final leagues = matches.map((m) => m.league).toSet().toList()..sort();
    final league = _selectedLeague ?? (leagues.isNotEmpty ? leagues.first : null);
    final leagueMatches = league == null ? matches : matches.where((m) => m.league == league).toList();
    final standings = league != null ? live.standingsForLeague(league) : <Map<String, dynamic>>[];

    return AsyncBody(
        loading: live.loading && live.allMatches.isEmpty,
        error: live.error,
        isEmpty: !live.loading && leagueMatches.isEmpty,
        emptyMessage: 'No live scores available',
        onRetry: () => live.load(),
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: () async {
            await live.load();
            await widget.onRefresh?.call();
          },
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              if (leagues.length > 1)
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      for (final l in leagues)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(l, overflow: TextOverflow.ellipsis),
                            selected: league == l,
                            onSelected: (_) => setState(() => _selectedLeague = l),
                          ),
                        ),
                    ],
                  ),
                ),
              for (final m in leagueMatches)
                MatchCard(
                  match: m,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => MatchDetailsScreen(match: m)),
                  ),
                ),
              if (standings.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
                  child: Text('Standings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
                Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      const ListTile(
                        dense: true,
                        title: Text('#  Team', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                        trailing: Text('Pts', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                      ),
                      const Divider(height: 1),
                      for (final row in standings.take(10))
                        ListTile(
                          dense: true,
                          leading: SizedBox(
                            width: 24,
                            child: Text('${row['rank'] ?? ''}', style: const TextStyle(color: Colors.white54)),
                          ),
                          title: Text(
                            row['team']?['name']?.toString() ?? '',
                            style: const TextStyle(fontSize: 13),
                          ),
                          trailing: Text(
                            '${row['points'] ?? ''}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
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
