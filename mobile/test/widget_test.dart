import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:predict_pro/main.dart';
import 'package:predict_pro/screens/premium_lock_screen.dart';
import 'package:predict_pro/services/api_client.dart';

void main() {
  testWidgets('shows login screen on launch', (WidgetTester tester) async {
    await tester.pumpWidget(const PredictProApp());
    await tester.pumpAndSettle();

    expect(find.text('Predict Pro'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });

  testWidgets('premium lock screen shows upgrade message', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: PremiumLockScreen()),
    );

    expect(
      find.text('Upgrade to Premium to unlock real-time smart signals.'),
      findsOneWidget,
    );
  });

  test('ApiException exposes message and code', () {
    final err = ApiException('User not found', code: 'UNAUTHORIZED');
    expect(err.toString(), 'User not found');
    expect(err.code, 'UNAUTHORIZED');
  });
}
