import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../providers/live_scores_notifier.dart';
import '../widgets/common_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.onRefresh});

  final Future<void> Function()? onRefresh;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _category;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LiveScoresNotifier>().load(query: {'published': 'true'});
    });
  }

  List<dynamic> _filterByCategory(List<dynamic> matches) {
    if (_category == null) return matches;
    return matches.where((m) => m.market == _category).toList();
  }

  @override
  Widget build(BuildContext context) {
    final live = context.watch<LiveScoresNotifier>();
    final categories = live.categories;
    final featured = _filterByCategory(live.liveMatches);
    final upcoming = _filterByCategory(live.upcomingMatches).take(10).toList();
    final timeFmt = DateFormat('EEE HH:mm');

    return AsyncBody(
        loading: live.loading && live.allMatches.isEmpty,
        error: live.error,
        isEmpty: !live.loading && featured.isEmpty && upcoming.isEmpty,
        emptyMessage: 'No published matches yet',
        onRetry: () => live.load(query: {'published': 'true'}),
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: () async {
            await live.load(query: {'published': 'true'});
            await widget.onRefresh?.call();
          },
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              if (categories.isNotEmpty) ...[
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: const Text('All'),
                          selected: _category == null,
                          onSelected: (_) => setState(() => _category = null),
                        ),
                      ),
                      for (final cat in categories)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(cat),
                            selected: _category == cat,
                            onSelected: (_) => setState(() => _category = cat),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text('Featured Live', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              if (featured.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No live matches right now', style: TextStyle(color: Colors.white54)),
                )
              else
                for (final m in featured) MatchCard(match: m),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Text('Upcoming Fixtures', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              if (upcoming.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No upcoming fixtures', style: TextStyle(color: Colors.white54)),
                )
              else
                for (final m in upcoming)
                  Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: ListTile(
                      title: Text('${m.homeTeam} vs ${m.awayTeam}'),
                      subtitle: Text('${m.league} · ${timeFmt.format(m.matchDatetime.toLocal())}'),
                    ),
                  ),
            ],
          ),
        ),
      );
  }
}
