import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common_widgets.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  final _api = ApiClient();
  List<NewsArticle> _articles = [];
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
      final list = await _api.getNews();
      setState(() => _articles = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  String _categoryLabel(String category) {
    switch (category.toLowerCase()) {
      case 'injury':
        return 'Injury';
      case 'transfer':
        return 'Transfer';
      case 'lineup':
        return 'Lineup';
      default:
        return category;
    }
  }

  void _openArticle(NewsArticle article) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        builder: (_, controller) => Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: controller,
            children: [
              Text(article.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                '${_categoryLabel(article.category)} · ${DateFormat.yMMMd().format(article.createdAt.toLocal())}',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12),
              ),
              const SizedBox(height: 16),
              Text(article.body, style: const TextStyle(height: 1.5)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AsyncBody(
        loading: _loading,
        error: _error,
        isEmpty: !_loading && _articles.isEmpty,
        emptyMessage: 'No news articles yet',
        onRetry: _load,
        child: RefreshIndicator(
          color: AppColors.purple,
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 24, top: 8),
            itemCount: _articles.length,
            itemBuilder: (context, index) {
              final a = _articles[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: ListTile(
                  onTap: () => _openArticle(a),
                  title: Text(a.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    '${_categoryLabel(a.category)} · ${DateFormat.MMMd().format(a.createdAt.toLocal())}',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                ),
              );
            },
          ),
        ),
      );
  }
}
