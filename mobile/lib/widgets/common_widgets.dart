import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../models/models.dart';

class ResultBadge extends StatelessWidget {
  const ResultBadge({super.key, required this.status});

  final String? status;

  @override
  Widget build(BuildContext context) {
    if (status == null || status == 'pending') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade800,
          borderRadius: BorderRadius.circular(6),
        ),
        child: const Text('PENDING', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      );
    }

    final isWin = status == 'win';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (isWin ? AppColors.win : AppColors.loss).withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: isWin ? AppColors.win : AppColors.loss),
      ),
      child: Text(
        isWin ? 'WIN' : 'LOSS',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isWin ? AppColors.win : AppColors.loss,
        ),
      ),
    );
  }
}

class TeamLogo extends StatelessWidget {
  const TeamLogo({super.key, this.url, this.size = 28});

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return CircleAvatar(
        radius: size / 2,
        backgroundColor: AppColors.card,
        child: Icon(Icons.sports_soccer, size: size * 0.55, color: Colors.white38),
      );
    }
    return ClipOval(
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => CircleAvatar(
          radius: size / 2,
          backgroundColor: AppColors.card,
          child: Icon(Icons.sports_soccer, size: size * 0.55, color: Colors.white38),
        ),
      ),
    );
  }
}

class MatchScoreRow extends StatelessWidget {
  const MatchScoreRow({super.key, required this.match, this.compact = false});

  final MatchModel match;
  final bool compact;

  String _statusLabel() {
    if (match.isLive && match.currentMinute != null) {
      return "${match.currentMinute}'";
    }
    if (match.matchStatus == 'HT') return 'HT';
    if (match.matchStatus == 'FT') return 'FT';
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final status = _statusLabel();
    final showScore = match.isLive || match.matchStatus == 'FT' || match.matchStatus == 'HT';

    return Row(
      children: [
        Expanded(
          child: Row(
            children: [
              if (!compact) TeamLogo(url: match.homeTeamLogoUrl),
              if (!compact) const SizedBox(width: 8),
              Expanded(
                child: Text(
                  match.homeTeam,
                  style: TextStyle(fontSize: compact ? 13 : 14, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          width: compact ? 56 : 72,
          child: Column(
            children: [
              if (status.isNotEmpty)
                Text(status, style: TextStyle(fontSize: 11, color: AppColors.purple)),
              Text(
                showScore ? '${match.homeScore ?? 0} - ${match.awayScore ?? 0}' : 'vs',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  match.awayTeam,
                  style: TextStyle(fontSize: compact ? 13 : 14, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                ),
              ),
              if (!compact) const SizedBox(width: 8),
              if (!compact) TeamLogo(url: match.awayTeamLogoUrl),
            ],
          ),
        ),
      ],
    );
  }
}

class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.match, this.trailing, this.onTap});

  final MatchModel match;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      match.league,
                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6)),
                    ),
                  ),
                  if (match.isLive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('LIVE', style: TextStyle(fontSize: 10, color: AppColors.purple)),
                    ),
                  ?trailing,
                  if (onTap != null)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(Icons.chevron_right, size: 18, color: Colors.white38),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              MatchScoreRow(match: match),
            ],
          ),
        ),
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.color,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Column(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: color ?? AppColors.purple),
                const SizedBox(height: 4),
              ],
              Text(
                value,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.6)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class OddsBox extends StatelessWidget {
  const OddsBox({
    super.key,
    required this.label,
    required this.odds,
    this.selected = false,
  });

  final String label;
  final double? odds;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.purple.withValues(alpha: 0.35) : AppColors.background,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.purple : Colors.white24,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              odds?.toStringAsFixed(2) ?? '—',
              style: TextStyle(
                fontSize: 13,
                color: selected ? Colors.white : Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AsyncBody extends StatelessWidget {
  const AsyncBody({
    super.key,
    required this.loading,
    required this.error,
    required this.isEmpty,
    required this.emptyMessage,
    required this.child,
    this.onRetry,
  });

  final bool loading;
  final String? error;
  final bool isEmpty;
  final String emptyMessage;
  final Widget child;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.purple));
    }
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error!, textAlign: TextAlign.center),
              if (onRetry != null) ...[
                const SizedBox(height: 12),
                FilledButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ],
          ),
        ),
      );
    }
    if (isEmpty) {
      return Center(child: Text(emptyMessage, style: const TextStyle(color: Colors.white54)));
    }
    return child;
  }
}
