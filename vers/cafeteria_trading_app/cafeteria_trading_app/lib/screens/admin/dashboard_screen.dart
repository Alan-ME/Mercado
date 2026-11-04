import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/mock/kpis_mock.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/kpi_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= 1100;
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _KpiGrid(wide: wide),
            const SizedBox(height: 24),
            if (wide)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 3, child: _RevenueChart()),
                  const SizedBox(width: 20),
                  Expanded(flex: 2, child: _CategoryDonut()),
                ],
              )
            else ...[
              _RevenueChart(),
              const SizedBox(height: 20),
              _CategoryDonut(),
            ],
            const SizedBox(height: 24),
            _TopProductsTable(),
          ],
        );
      },
    );
  }
}

class _KpiGrid extends StatelessWidget {
  final bool wide;
  const _KpiGrid({required this.wide});
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount:
          wide ? 4 : (MediaQuery.of(context).size.width >= 600 ? 2 : 1),
      childAspectRatio: 1.9,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [for (final k in KpisMock.dashboard) KpiCard(kpi: k)],
    );
  }
}

class _RevenueChart extends StatefulWidget {
  @override
  State<_RevenueChart> createState() => _RevenueChartState();
}

class _RevenueChartState extends State<_RevenueChart> {
  int _range = 0; // 0 = semana, 1 = mes

  @override
  Widget build(BuildContext context) {
    final data = KpisMock.weeklyRevenue;
    final maxV = data.reduce((a, b) => a > b ? a : b);
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Evolución de ingresos',
                  style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              _rangeToggle(),
            ],
          ),
          const SizedBox(height: 4),
          Text('Ingresos por día — última semana',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 24),
          SizedBox(
            height: 260,
            child: BarChart(
              BarChartData(
                maxY: maxV * 1.25,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color:
                        Theme.of(context).dividerColor.withValues(alpha: 0.4),
                    strokeWidth: 1,
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 44,
                      getTitlesWidget: (v, _) => Text(
                        v == 0 ? '' : '\$${v.toInt()}',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= KpisMock.weekLabels.length)
                          return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(KpisMock.weekLabels[i],
                              style: Theme.of(context).textTheme.labelSmall),
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, gi, rod, ri) => BarTooltipItem(
                      Fmt.money(rod.toY),
                      const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                barGroups: [
                  for (var i = 0; i < data.length; i++)
                    BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(
                          toY: data[i],
                          width: 20,
                          borderRadius: BorderRadius.circular(4),
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              AppColors.accentPrimary.withValues(alpha: 0.4),
                              AppColors.accentPrimary,
                            ],
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _rangeToggle() {
    final labels = ['Semana', 'Mes'];
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < labels.length; i++)
            GestureDetector(
              onTap: () => setState(() => _range = i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: i == _range
                      ? AppColors.accentPrimary.withValues(alpha: 0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  labels[i],
                  style: TextStyle(
                    color: i == _range ? AppColors.accentPrimary : null,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryDonut extends StatelessWidget {
  static const _colors = [
    AppColors.accentPrimary,
    AppColors.accentSecondary,
    AppColors.info,
    AppColors.warning,
  ];

  @override
  Widget build(BuildContext context) {
    final entries = KpisMock.categoryShare.entries.toList();
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Composición por categoría',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('Share sobre ventas totales del mes',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 24),
          SizedBox(
            height: 220,
            child: Row(
              children: [
                Expanded(
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 3,
                      centerSpaceRadius: 55,
                      sections: [
                        for (var i = 0; i < entries.length; i++)
                          PieChartSectionData(
                            value: entries[i].value,
                            color: _colors[i % _colors.length],
                            radius: 42,
                            title: '${entries[i].value.toInt()}%',
                            titleStyle: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var i = 0; i < entries.length; i++)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: _colors[i % _colors.length],
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(entries[i].key,
                                    style:
                                        Theme.of(context).textTheme.bodyMedium),
                              ),
                              Text('${entries[i].value.toInt()}%',
                                  style:
                                      Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TopProductsTable extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final products = List.of(context.watch<AppState>().products)
      ..sort((a, b) => b.volume.compareTo(a.volume));
    final top = products.take(5).toList();
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Top productos por volumen',
                  style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Acción simulada — pendiente backend')),
                  );
                },
                child: const Text('Ver reporte completo'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final p in top) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: p.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(p.icon, color: p.accent, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.name,
                            style: Theme.of(context).textTheme.titleMedium),
                        Text(p.symbol,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(letterSpacing: 1)),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${p.volume} vendidos',
                            style: Theme.of(context).textTheme.titleMedium),
                        Text(
                          Fmt.pct(p.changePercent24h),
                          style: TextStyle(
                            color:
                                p.isUp ? AppColors.success : AppColors.danger,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Divider(
                height: 1,
                color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
          ],
        ],
      ),
    );
  }
}
