import 'package:flutter/material.dart';
import '../config/app_config.dart';

class PremiumLockScreen extends StatelessWidget {
  const PremiumLockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.purple.withValues(alpha: 0.4), width: 2),
              ),
              child: const Icon(Icons.lock_outline, size: 48, color: AppColors.purple),
            ),
            const SizedBox(height: 24),
            const Text(
              'Premium Feature',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Upgrade to Premium to unlock real-time smart signals.',
              style: TextStyle(fontSize: 15, color: Colors.white.withValues(alpha: 0.7), height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Text(
              'Sign in with premium@predictpro.local to preview premium access.',
              style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class PremiumGate extends StatelessWidget {
  const PremiumGate({super.key, required this.isPremium, required this.child});

  final bool isPremium;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (isPremium) return child;
    return const PremiumLockScreen();
  }
}
