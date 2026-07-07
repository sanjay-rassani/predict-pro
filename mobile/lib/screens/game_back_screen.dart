import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../providers/signals_notifier.dart';
import '../widgets/common_widgets.dart';
import 'odds_surprises_screen.dart';

class GameBackScreen extends StatefulWidget {
  const GameBackScreen({super.key});

  @override
  State<GameBackScreen> createState() => _GameBackScreenState();
}

class _GameBackScreenState extends State<GameBackScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SignalsNotifier>().loadComebackSignals();
    });
  }

  @override
  Widget build(BuildContext context) {
    final signals = context.watch<SignalsNotifier>();

    return AsyncBody(
      loading: signals.loadingComeback && signals.comebackSignals.isEmpty,
      error: signals.comebackError,
      isEmpty: !signals.loadingComeback && signals.comebackSignals.isEmpty,
      emptyMessage: 'No approved Comeback signals yet',
      onRetry: () => signals.loadComebackSignals(),
      child: RefreshIndicator(
        color: AppColors.purple,
        onRefresh: signals.loadComebackSignals,
        child: ListView.builder(
          padding: const EdgeInsets.only(bottom: 24, top: 8),
          itemCount: signals.comebackSignals.length,
          itemBuilder: (context, index) {
            final signal = signals.comebackSignals[index];
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
