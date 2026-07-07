import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/live_scores_notifier.dart';
import 'providers/signals_notifier.dart';
import 'screens/app_shell.dart';
import 'screens/login_screen.dart';
import 'services/notification_service.dart';
import 'services/session_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PredictProApp());
}

class PredictProApp extends StatelessWidget {
  const PredictProApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SessionService()..restore()),
        ChangeNotifierProvider(create: (_) => LiveScoresNotifier()),
        ChangeNotifierProvider(create: (_) => SignalsNotifier()),
        ChangeNotifierProvider(create: (_) => NotificationService()),
      ],
      child: MaterialApp(
        title: 'Predict Pro',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const _RootGate(),
      ),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionService>();
    if (!session.isLoggedIn) {
      return const LoginScreen();
    }
    return const AppShell();
  }
}
