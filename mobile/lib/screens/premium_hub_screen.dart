import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/session_service.dart';
import 'game_back_screen.dart';
import 'odds_surprises_screen.dart';
import 'premium_lock_screen.dart';
import 'signal_history_screen.dart';

class PremiumHubScreen extends StatelessWidget {
  const PremiumHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isPremium = context.watch<SessionService>().isPremium;
    if (!isPremium) return const PremiumLockScreen();

    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Surprise'),
              Tab(text: 'Game Back'),
              Tab(text: 'Analytics'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                OddsSurprisesScreen(),
                GameBackScreen(),
                SignalHistoryScreen(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
