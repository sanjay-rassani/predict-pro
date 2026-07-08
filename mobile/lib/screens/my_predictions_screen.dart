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

enum _ResultFilter { all, won, lost, pending }

class _MyPredictionsScreenState extends State<MyPredictionsScreen> {
  final _api = ApiClient();
  List<PredictionModel> _predictions = [];
  bool _loading = true;
  String? _error;
  _ResultFilter _filter = _ResultFilter.all;

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
      setState(() => _predictions = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  bool _matchesFilter(PredictionModel p) {
    final status = p.resultStatus ?? 'pending';
    switch (_filter) {
      case _ResultFilter.all:
        return true;
      case _ResultFilter.won:
        return status == 'win';
      case _ResultFilter.lost:
        return status == 'loss';
      case _ResultFilter.pending:
        return status == 'pending';
    }
  }

  int _countFor(_ResultFilter filter) {
    if (filter == _ResultFilter.all) return _predictions.length;
    final status = switch (filter) {
      _ResultFilter.won => 'win',
      _ResultFilter.lost => 'loss',
      _ResultFilter.pending => 'pending',
      _ResultFilter.all => '',
    };
    return _predictions.where((p) => (p.resultStatus ?? 'pending') == status).length;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _predictions.where(_matchesFilter).toList();

    return AsyncBody(
        loading: _loading,
        error: _error,
        isEmpty: !_loading && _predictions.isEmpty,
        emptyMessage: 'No prediction history yet',
        onRetry: _load,
        child: Column(
          children: [
            _FilterBar(
              filter: _filter,
              countFor: _countFor,
              onChanged: (f) => setState(() => _filter = f),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.purple,
                onRefresh: _load,
                child: filtered.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 80),
                          Center(
                            child: Text('No predictions for this filter',
                                style: TextStyle(color: Colors.white54)),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(bottom: 24, top: 4),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final p = filtered[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            child: ListTile(
                              title: Text('${p.homeTeam ?? ''} vs ${p.awayTeam ?? ''}'),
                              subtitle: Text(
                                  '${p.type} · Pick ${p.predictedValue}${p.oddsDisplay != null ? ' @ ${p.oddsDisplay!.toStringAsFixed(2)}' : ''}'),
                              trailing: ResultBadge(status: p.resultStatus),
                            ),
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.filter, required this.countFor, required this.onChanged});

  final _ResultFilter filter;
  final int Function(_ResultFilter) countFor;
  final ValueChanged<_ResultFilter> onChanged;

  static const _labels = {
    _ResultFilter.all: 'All',
    _ResultFilter.won: 'Won',
    _ResultFilter.lost: 'Lost',
    _ResultFilter.pending: 'Pending',
  };

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          for (final entry in _labels.entries)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text('${entry.value} (${countFor(entry.key)})'),
                selected: filter == entry.key,
                onSelected: (_) => onChanged(entry.key),
              ),
            ),
        ],
      ),
    );
  }
}
