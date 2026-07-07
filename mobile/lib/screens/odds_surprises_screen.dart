import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../providers/signals_notifier.dart';
import '../widgets/common_widgets.dart';

class SignalCard extends StatelessWidget {
  const SignalCard({
    super.key,
    required this.signal,
    this.liveOdds,
  });

  final PredictionModel signal;
  final LiveOddsUpdate? liveOdds;

  @override
  Widget build(BuildContext context) {
    final homeOdds = liveOdds?.values['Home'] ?? signal.oddsDisplay;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    signal.league ?? '',
                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6)),
                  ),
                ),
                if (liveOdds != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.purple.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('LIVE ODDS', style: TextStyle(fontSize: 10, color: AppColors.purple)),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${signal.homeTeam ?? ''} vs ${signal.awayTeam ?? ''}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(signal.predictedValue, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            if (liveOdds != null && liveOdds!.values.isNotEmpty) ...[
              Text(
                '${liveOdds!.bookmaker ?? 'Live'} · ${liveOdds!.market ?? 'Odds'}',
                style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.5)),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: liveOdds!.values.entries
                    .map(
                      (e) => Chip(
                        label: Text('${e.key}: ${e.value.toStringAsFixed(2)}'),
                        backgroundColor: AppColors.background,
                      ),
                    )
                    .toList(),
              ),
            ] else if (homeOdds != null)
              Text('Odds @ ${homeOdds.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class OddsSurprisesScreen extends StatefulWidget {
  const OddsSurprisesScreen({super.key});

  @override
  State<OddsSurprisesScreen> createState() => _OddsSurprisesScreenState();
}

class _OddsSurprisesScreenState extends State<OddsSurprisesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SignalsNotifier>().loadSurpriseSignals();
    });
  }

  @override
  Widget build(BuildContext context) {
    final signals = context.watch<SignalsNotifier>();

    return AsyncBody(
      loading: signals.loadingSurprise && signals.surpriseSignals.isEmpty,
      error: signals.surpriseError,
      isEmpty: !signals.loadingSurprise && signals.surpriseSignals.isEmpty,
      emptyMessage: 'No approved Surprise signals yet',
      onRetry: () => signals.loadSurpriseSignals(),
      child: RefreshIndicator(
        color: AppColors.purple,
        onRefresh: signals.loadSurpriseSignals,
        child: ListView.builder(
          padding: const EdgeInsets.only(bottom: 24, top: 8),
          itemCount: signals.surpriseSignals.length,
          itemBuilder: (context, index) {
            final signal = signals.surpriseSignals[index];
            return SignalCard(
              signal: signal,
              liveOdds: signals.oddsForMatch(signal.matchId),
            );
          },
        ),
      ),
    );
  }
}
