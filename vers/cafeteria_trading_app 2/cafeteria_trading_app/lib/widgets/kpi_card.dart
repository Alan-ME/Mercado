import 'package:flutter/material.dart';
import '../models/kpi.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class KpiCard extends StatefulWidget {
  final Kpi kpi;
  const KpiCard({super.key, required this.kpi});

  @override
  State<KpiCard> createState() => _KpiCardState();
}

class _KpiCardState extends State<KpiCard> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final k = widget.kpi;
    const upColor = AppColors.success;
    const downColor = AppColors.danger;
    final deltaColor = k.isUp ? upColor : downColor;

    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        transform: _hover
            ? (Matrix4.identity()..translate(0.0, -2.0))
            : Matrix4.identity(),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor),
          boxShadow: _hover
              ? [
                  BoxShadow(
                      color: k.accent.withValues(alpha: 0.12),
                      blurRadius: 20,
                      offset: const Offset(0, 6))
                ]
              : [],
        ),
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: k.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(k.icon, color: k.accent, size: 18),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: deltaColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(k.isUp ? Icons.trending_up : Icons.trending_down,
                          color: deltaColor, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        Fmt.pct(k.delta),
                        style: TextStyle(
                            color: deltaColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(k.label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text(
              k.value,
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
