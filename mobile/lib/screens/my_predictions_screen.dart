import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common_widgets.dart';

class MyPredictionsScreen extends StatefulWidget {
  const MyPredictionsScreen({super.key});

  @override
  State<MyPredictionsScreen> createState() => _MyPredictionsScreenState();
}

class _MyPredictionsScreenState extends State<MyPredictionsScreen> {
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
      final list = await _api.getPredictions(query: {'publish_status': 'published'});
      final settled = list.where((p) => p.resultStatus != null && p.resultStatus != 'pending').toList();
      setState(() => _predictions = settled.isNotEmpty ? settled : list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AsyncBody(
        loading: _loading,
        error: _error,
        isEmpty: !_loading && _predictions.isEmpty,
        emptyMessage: 'No prediction history yet',
        onRetry: _load,
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 24, top: 8),
            itemCount: _predictions.length,
            itemBuilder: (context, index) {
              final p = _predictions[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: ListTile(
                  title: Text('${p.homeTeam ?? ''} vs ${p.awayTeam ?? ''}'),
                  subtitle: Text('${p.type} · Pick ${p.predictedValue}${p.oddsDisplay != null ? ' @ ${p.oddsDisplay!.toStringAsFixed(2)}' : ''}'),
                  trailing: ResultBadge(status: p.resultStatus),
                ),
              );
            },
          ),
        ),
      );
  }
}
