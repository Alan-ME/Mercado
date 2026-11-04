import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _range = 1; // 0 = 24h, 1 = 7d, 2 = 30d

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    const upColor = AppColors.success;
    const downColor = AppColors.danger;
    final color = p.isUp ? upColor : downColor;

    return Scaffold(
      appBar: AppBar(
        title: Text('${p.symbol} · ${p.name}'),
      ),
      body: LayoutBuilder(
        builder: (context, c) {
          final wide = c.maxWidth >= 900;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: p.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(p.icon, color: p.accent, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.symbol,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(letterSpacing: 1.2)),
                        Text(p.name,
                            style: Theme.of(context).textTheme.headlineLarge),
                        const SizedBox(height: 6),
                        Text(p.description,
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(Fmt.money(p.price),
                          style: Theme.of(context)
                              .textTheme
                              .displayMedium
                              ?.copyWith(
                            fontFeatures: const [FontFeature.tabularFigures()],
                          )),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                                p.isUp
                                    ? Icons.trending_up
                                    : Icons.trending_down,
                                color: color,
                                size: 16),
                            const SizedBox(width: 4),
                            Text('${Fmt.pct(p.changePercent24h)} · 24h',
                                style: TextStyle(
                                    color: color, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
              if (wide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                        flex: 3,
                        child: _ChartCard(
                            product: p,
                            range: _range,
                            onRange: (v) => setState(() => _range = v))),
                    const SizedBox(width: 20),
                    Expanded(flex: 2, child: _StatsPanel(product: p)),
                  ],
                )
              else ...[
                _ChartCard(
                    product: p,
                    range: _range,
                    onRange: (v) => setState(() => _range = v)),
                const SizedBox(height: 20),
                _StatsPanel(product: p),
              ],
              const SizedBox(height: 24),
              _OrderCta(product: p),
            ],
          );
        },
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final Product product;
  final int range;
  final ValueChanged<int> onRange;
  const _ChartCard(
      {required this.product, required this.range, required this.onRange});

  @override
  Widget build(BuildContext context) {
    final color = product.isUp ? AppColors.success : AppColors.danger;
    final data = _dataForRange(product.priceHistory, range);
    return Container(
      padding: const EdgeInsets.all(20),
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
              Text('Precio en la semana',
                  style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              _RangeToggle(active: range, onTap: onRange),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 300,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color:
                        Theme.of(context).dividerColor.withValues(alpha: 0.5),
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 44,
                      getTitlesWidget: (v, _) => Text(
                        Fmt.money(v),
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (spots) => spots
                        .map((s) => LineTooltipItem(
                              Fmt.money(s.y),
                              const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600),
                            ))
                        .toList(),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < data.length; i++)
                        FlSpot(i.toDouble(), data[i])
                    ],
                    isCurved: true,
                    curveSmoothness: 0.35,
                    color: color,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          color.withValues(alpha: 0.25),
                          color.withValues(alpha: 0)
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<double> _dataForRange(List<double> base, int range) {
    switch (range) {
      case 0:
        return base.sublist(base.length - 6);
      case 1:
        return base;
      case 2:
        // extendemos artificialmente para simular 30d
        final out = <double>[...base];
        for (var i = 0; i < 15; i++) {
          out.insert(0, base.first * (1 - (0.05 - i * 0.003)));
        }
        return out;
    }
    return base;
  }
}

class _RangeToggle extends StatelessWidget {
  final int active;
  final ValueChanged<int> onTap;
  const _RangeToggle({required this.active, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final labels = ['24h', '7d', '30d'];
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
              onTap: () => onTap(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: i == active
                      ? AppColors.accentPrimary.withValues(alpha: 0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  labels[i],
                  style: TextStyle(
                    color: i == active ? AppColors.accentPrimary : null,
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

class _StatsPanel extends StatelessWidget {
  final Product product;
  const _StatsPanel({required this.product});
  @override
  Widget build(BuildContext context) {
    final rows = <(String, String, Color?)>[
      ('Categoría', product.category, null),
      ('Pedidos hoy', product.volume.toString(), null),
      (
        'Cambio hoy',
        Fmt.pct(product.changePercent24h),
        product.changePercent24h >= 0 ? AppColors.success : AppColors.danger
      ),
      (
        'Cambio semanal',
        Fmt.pct(product.changePercentWeek),
        product.changePercentWeek >= 0 ? AppColors.success : AppColors.danger
      ),
      (
        'Mínimo semanal',
        Fmt.money(product.priceHistory.reduce((a, b) => a < b ? a : b)),
        null
      ),
      (
        'Máximo semanal',
        Fmt.money(product.priceHistory.reduce((a, b) => a > b ? a : b)),
        null
      ),
    ];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ficha del café', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          for (final r in rows) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Expanded(
                      child: Text(r.$1,
                          style: Theme.of(context).textTheme.bodyMedium)),
                  Text(
                    r.$2,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: r.$3 ??
                          Theme.of(context).textTheme.titleMedium?.color,
                      fontFeatures: const [FontFeature.tabularFigures()],
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

class _OrderCta extends StatelessWidget {
  final Product product;
  const _OrderCta({required this.product});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            product.accent.withValues(alpha: 0.18),
            product.accent.withValues(alpha: 0.05)
          ],
        ),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sumalo a tu pedido',
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text(
                  'Preparación en menos de 4 minutos. Precio actual: ${Fmt.money(product.price)}.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.add_shopping_cart),
            label: const Text('Agregar al carrito'),
            onPressed: () {
              context.read<AppState>().addToCart(product.id);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${product.name} agregado al carrito')),
              );
            },
          ),
        ],
      ),
    );
  }
}
