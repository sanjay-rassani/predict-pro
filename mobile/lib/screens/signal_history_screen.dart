import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../providers/signals_notifier.dart';
import '../widgets/common_widgets.dart';

class SignalHistoryScreen extends StatefulWidget {
  const SignalHistoryScreen({super.key});

  @override
  State<SignalHistoryScreen> createState() => _SignalHistoryScreenState();
}

class _SignalHistoryScreenState extends State<SignalHistoryScreen> {
  String _period = 'today';
  final _leagueController = TextEditingController();

  static const _periods = {
    'today': 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _leagueController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    await context.read<SignalsNotifier>().loadAnalytics(
          period: _period,
          league: _leagueController.text.trim().isEmpty ? null : _leagueController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final signals = context.watch<SignalsNotifier>();
    final analytics = signals.analytics;

    return AsyncBody(
      loading: signals.loadingAnalytics && analytics == null,
      error: signals.analyticsError,
      isEmpty: !signals.loadingAnalytics && analytics != null && analytics.signals.isEmpty,
      emptyMessage: 'No signal history for this filter',
      onRetry: _load,
      child: RefreshIndicator(
        color: AppColors.purple,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Wrap(
                spacing: 8,
                children: _periods.entries
                    .map(
                      (e) => FilterChip(
                        label: Text(e.value),
                        selected: _period == e.key,
                        onSelected: (_) {
                          setState(() => _period = e.key);
                          _load();
                        },
                      ),
                    )
                    .toList(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _leagueController,
                      decoration: const InputDecoration(
                        labelText: 'League filter',
                        hintText: 'e.g. Premier League',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onSubmitted: (_) => _load(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(onPressed: _load, child: const Text('Apply')),
                ],
              ),
            ),
            if (analytics != null) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _SummaryGrid(analytics: analytics),
              ),
              const SizedBox(height: 12),
              for (final signal in analytics.signals)
                Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: ListTile(
                    title: Text('${signal.homeTeam ?? ''} vs ${signal.awayTeam ?? ''}'),
                    subtitle: Text('${signal.type} · ${signal.league ?? ''}'),
                    trailing: ResultBadge(status: signal.resultStatus),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.analytics});

  final SignalAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final surprise = analytics.byType['Surprise'];
    final comeback = analytics.byType['Comeback'];

    final resolved = analytics.wins + analytics.losses;
    final pending = analytics.total - resolved;

    final oddsValues = analytics.signals
        .map((s) => s.oddsDisplay)
        .whereType<double>()
        .toList();
    final avgOdds = oddsValues.isNotEmpty
        ? oddsValues.reduce((a, b) => a + b) / oddsValues.length
        : null;
    final bestOdds = oddsValues.isNotEmpty
        ? oddsValues.reduce((a, b) => a > b ? a : b)
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(
          children: [
            _StatCard(label: 'Total', value: '${analytics.total}'),
            const SizedBox(width: 8),
            _StatCard(label: 'Wins', value: '${analytics.wins}', color: AppColors.win),
            const SizedBox(width: 8),
            _StatCard(label: 'Losses', value: '${analytics.losses}', color: AppColors.loss),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _StatCard(label: 'Pending', value: '$pending'),
            const SizedBox(width: 8),
            _StatCard(label: 'Resolved', value: '$resolved'),
            const SizedBox(width: 8),
            _StatCard(
              label: 'Avg Odds',
              value: avgOdds != null ? avgOdds.toStringAsFixed(2) : '—',
            ),
            const SizedBox(width: 8),
            _StatCard(
              label: 'Best Odds',
              value: bestOdds != null ? bestOdds.toStringAsFixed(2) : '—',
              color: AppColors.purple,
            ),
          ],
        ),
        const SizedBox(height: 16),
        _SuccessBar(
          label: 'Overall success rate',
          successRate: analytics.successRate,
          wins: analytics.wins,
          losses: analytics.losses,
        ),
        const SizedBox(height: 16),
        const Text('By Signal Type', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        if (surprise != null) _TypeRow(label: 'Surprise', stats: surprise),
        if (comeback != null) _TypeRow(label: 'Comeback', stats: comeback),
      ],
    );
  }
}

class _SuccessBar extends StatelessWidget {
  const _SuccessBar({
    required this.label,
    required this.successRate,
    required this.wins,
    required this.losses,
  });

  final int? successRate;
  final int wins;
  final int losses;
  final String label;

  @override
  Widget build(BuildContext context) {
    final resolved = wins + losses;
    final fraction = resolved > 0 ? wins / resolved : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 13, color: Colors.white70)),
            Text(
              successRate != null ? '$successRate%' : 'No results yet',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.purple),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: fraction,
            minHeight: 10,
            backgroundColor: AppColors.loss.withValues(alpha: 0.3),
            valueColor: const AlwaysStoppedAnimation(AppColors.win),
          ),
        ),
        const SizedBox(height: 4),
        Text('$wins won · $losses lost', style: const TextStyle(fontSize: 11, color: Colors.white54)),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, this.color});

  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(label,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.6))),
              const SizedBox(height: 4),
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}

class _TypeRow extends StatelessWidget {
  const _TypeRow({required this.label, required this.stats});

  final String label;
  final SignalTypeStats stats;

  @override
  Widget build(BuildContext context) {
    final resolved = stats.wins + stats.losses;
    final fraction = resolved > 0 ? stats.wins / resolved : 0.0;
    final pending = stats.total - resolved;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(
                  stats.successRate != null ? '${stats.successRate}%' : '—',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.purple),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: fraction,
                minHeight: 8,
                backgroundColor: AppColors.loss.withValues(alpha: 0.25),
                valueColor: const AlwaysStoppedAnimation(AppColors.win),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${stats.total} signals · ${stats.wins}W / ${stats.losses}L · $pending pending',
              style: const TextStyle(fontSize: 12, color: Colors.white54),
            ),
          ],
        ),
      ),
    );
  }
}
