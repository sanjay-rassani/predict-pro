import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../services/session_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _controller = TextEditingController(text: 'free@predictpro.local');
  final _passwordController = TextEditingController(text: 'free123');
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  void _fillDemo(String email, String password) {
    _controller.text = email;
    _passwordController.text = password;
  }

  Future<void> _login() async {
    final email = _controller.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Email and password are required');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<SessionService>().login(email, password);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Icon(Icons.sports_soccer, size: 64, color: AppColors.purple),
              const SizedBox(height: 16),
              const Text(
                'Predict Pro',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in with your demo account',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                onSubmitted: (_) => _login(),
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    label: const Text('Free user'),
                    onPressed: () => _fillDemo('free@predictpro.local', 'free123'),
                  ),
                  ActionChip(
                    label: const Text('Premium user'),
                    onPressed: () => _fillDemo('premium@predictpro.local', 'premium123'),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.loss)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Continue'),
              ),
              const Spacer(),
              Text(
                'API: ${AppConfig.apiBaseUrl}',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.35)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
