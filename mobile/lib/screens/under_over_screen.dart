import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common_widgets.dart';

class UnderOverScreen extends StatefulWidget {
  const UnderOverScreen({super.key});

  @override
  State<UnderOverScreen> createState() => _UnderOverScreenState();
}

class _UnderOverScreenState extends State<UnderOverScreen> {
  final _api = ApiClient();
  List<PredictionModel> _predictions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.getPredictions(query: {
        'type': 'UnderOver',
        'publish_status': 'published',
      });
      setState(() => _predictions = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  bool _isOver(String value) {
    final v = value.toLowerCase();
    return v.contains('over');
  }

  @override
  Widget build(BuildContext context) {
    return AsyncBody(
        loading: _loading,
        error: _error,
        isEmpty: !_loading && _predictions.isEmpty,
        emptyMessage: 'No published Under/Over predictions',
        onRetry: _load,
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 24, top: 8),
            itemCount: _predictions.length,
            itemBuilder: (context, index) {
              final p = _predictions[index];
              final over = _isOver(p.predictedValue);
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.league ?? '',
                        style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${p.homeTeam ?? ''} vs ${p.awayTeam ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          OddsBox(
                            label: 'Over 2.5',
                            odds: over ? p.oddsDisplay : null,
                            selected: over,
                          ),
                          OddsBox(
                            label: 'Under 2.5',
                            odds: !over ? p.oddsDisplay : null,
                            selected: !over,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      );
  }
}
