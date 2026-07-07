import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common_widgets.dart';

class Predictions1x2Screen extends StatefulWidget {
  const Predictions1x2Screen({super.key});

  @override
  State<Predictions1x2Screen> createState() => _Predictions1x2ScreenState();
}

class _Predictions1x2ScreenState extends State<Predictions1x2Screen> {
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
        'type': '1X2',
        'publish_status': 'published',
      });
      setState(() => _predictions = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  String _pickLabel(String value) {
    switch (value) {
      case '1':
        return '1';
      case 'X':
        return 'X';
      case '2':
        return '2';
      default:
        return value;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AsyncBody(
        loading: _loading,
        error: _error,
        isEmpty: !_loading && _predictions.isEmpty,
        emptyMessage: 'No published 1X2 predictions',
        onRetry: _load,
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 24, top: 8),
            itemCount: _predictions.length,
            itemBuilder: (context, index) {
              final p = _predictions[index];
              final pick = p.predictedValue.toUpperCase();
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
                          OddsBox(label: '1', odds: pick == '1' ? p.oddsDisplay : null, selected: pick == '1'),
                          OddsBox(label: 'X', odds: pick == 'X' ? p.oddsDisplay : null, selected: pick == 'X'),
                          OddsBox(label: '2', odds: pick == '2' ? p.oddsDisplay : null, selected: pick == '2'),
                        ],
                      ),
                      if (pick != '1' && pick != 'X' && pick != '2') ...[
                        const SizedBox(height: 8),
                        Text('Pick: ${_pickLabel(pick)} @ ${p.oddsDisplay?.toStringAsFixed(2) ?? '—'}'),
                      ],
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
