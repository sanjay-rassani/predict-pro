import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../providers/live_scores_notifier.dart';
import '../providers/signals_notifier.dart';
import '../services/notification_service.dart';
import '../services/session_service.dart';
import 'home_screen.dart';
import 'live_scores_screen.dart';
import 'my_predictions_screen.dart';
import 'news_screen.dart';
import 'predictions_1x2_screen.dart';
import 'premium_hub_screen.dart';
import 'under_over_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  SignalsNotifier? _signals;
  NotificationService? _notifications;

  static const _titles = [
    'Home',
    'Live Scores',
    '1X2 Predictions',
    'Under / Over 2.5',
    'Smart Signals',
    'News',
    'My Predictions',
  ];

  late final List<Widget> _screens = [
    HomeScreen(onRefresh: _refreshLive),
    LiveScoresScreen(onRefresh: _refreshLive),
    const Predictions1x2Screen(),
    const UnderOverScreen(),
    const PremiumHubScreen(),
    const NewsScreen(),
    const MyPredictionsScreen(),
  ];

  Future<void> _refreshLive() async {
    await context.read<LiveScoresNotifier>().load(query: {'published': 'true'});
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final session = context.read<SessionService>();
    final live = context.read<LiveScoresNotifier>();
    final signals = context.read<SignalsNotifier>();
    final notifications = context.read<NotificationService>();

    if (session.user == null) return;

    _signals = signals;
    _notifications = notifications;

    live.connectSocket(session.user!.role);
    signals.connectSocket(session.user!.role);

    if (session.isPremium) {
      await notifications.registerForPush(session.user!);
    }

    signals.addListener(_onSignalsUpdate);
    notifications.addListener(_onNotificationUpdate);
  }

  void _onSignalsUpdate() {
    final event = context.read<SignalsNotifier>().latestPush;
    if (event != null) {
      context.read<NotificationService>().handleSignalApproved(event);
      context.read<SignalsNotifier>().clearLatestPush();
    }
  }

  void _onNotificationUpdate() {
    final alert = context.read<NotificationService>().pendingAlert;
    if (alert == null || !mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(alert.title, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(alert.body),
          ],
        ),
        action: SnackBarAction(
          label: 'Dismiss',
          onPressed: () => context.read<NotificationService>().clearPendingAlert(),
        ),
        duration: const Duration(seconds: 6),
      ),
    );
    context.read<NotificationService>().clearPendingAlert();
  }

  @override
  void dispose() {
    _signals?.removeListener(_onSignalsUpdate);
    _notifications?.removeListener(_onNotificationUpdate);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionService>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          if (session.isPremium)
            Container(
              margin: const EdgeInsets.only(right: 4),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.purple.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('PREMIUM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              context.read<LiveScoresNotifier>().disconnectSocket();
              context.read<SignalsNotifier>().disconnectSocket();
              await session.logout();
            },
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: 'Live'),
          NavigationDestination(icon: Icon(Icons.looks_one_outlined), selectedIcon: Icon(Icons.looks_one), label: '1X2'),
          NavigationDestination(icon: Icon(Icons.trending_up_outlined), selectedIcon: Icon(Icons.trending_up), label: 'O/U'),
          NavigationDestination(icon: Icon(Icons.bolt_outlined), selectedIcon: Icon(Icons.bolt), label: 'Signals'),
          NavigationDestination(icon: Icon(Icons.article_outlined), selectedIcon: Icon(Icons.article), label: 'News'),
          NavigationDestination(icon: Icon(Icons.history), label: 'History'),
        ],
      ),
    );
  }
}
