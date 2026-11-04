import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme/app_text_styles.dart';
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
    final isUp = p.isUp;
    const upColor = AppColors.accentPrimary;
    const downColor = AppColors.danger;
    final trendColor = isUp ? upColor : downColor;

    return Scaffold(
      backgroundColor: const Color(0xFF0F121A),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, c) {
            final wide = c.maxWidth >= 900;
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Botón "← volver" idéntico a la imagen 2
                  _buildBackButton(context),
                  const SizedBox(height: 22),

                  // Contenedores principales (gráfico a la izquierda y ficha a la derecha)
                  if (wide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 5,
                          child: _buildChartBox(p, trendColor),
                        ),
                        const SizedBox(width: 22),
                        Expanded(
                          flex: 4,
                          child: _buildInfoCard(context, p, trendColor),
                        ),
                      ],
                    )
                  else ...[
                    _buildChartBox(p, trendColor),
                    const SizedBox(height: 20),
                    _buildInfoCard(context, p, trendColor),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // Botón superior izquierdo tipo píldora verde "← volver"
  Widget _buildBackButton(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context).pop(),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.accentPrimary,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.accentPrimary.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.arrow_back, size: 15, color: Colors.black),
            SizedBox(width: 6),
            Text(
              'volver',
              style: TextStyle(
                fontFamily: AppStyles.fontLemonMilk,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Caja izquierda con gráfico de trading interactivo
  Widget _buildChartBox(Product p, Color trendColor) {
    final data = _dataForRange(p.priceHistory, _range);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF161A24),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF232838)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabecera del gráfico: Nombre en mayúsculas, descripción y precio
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name.toUpperCase(),
                      style: AppStyles.cardTitle(
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      p.description,
                      style: AppStyles.heroBody(color: const Color(0xFF8B92A5)).copyWith(
                        fontSize: 12,
                        shadows: AppStyles.textShadows(stroke: 0.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    Fmt.money(p.price),
                    style: const TextStyle(
                      fontFamily: AppStyles.fontLemonMilk,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: trendColor.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: trendColor.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      '${Fmt.pct(p.changePercent24h)} · 24h',
                      style: TextStyle(
                        fontFamily: AppStyles.fontLemonMilk,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: trendColor,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Selector de rango (24h, 7d, 30d)
          Align(
            alignment: Alignment.centerRight,
            child: _RangeToggle(
              active: _range,
              onTap: (v) => setState(() => _range = v),
            ),
          ),
          const SizedBox(height: 14),

          // Gráfico de línea con estilo trading neón
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => const FlLine(
                    color: Color(0xFF232838),
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 42,
                      getTitlesWidget: (v, _) => Text(
                        Fmt.money(v),
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < data.length; i++)
                        FlSpot(i.toDouble(), data[i]),
                    ],
                    isCurved: true,
                    curveSmoothness: 0.35,
                    color: trendColor,
                    barWidth: 2.8,
                    shadow: Shadow(
                      color: trendColor.withValues(alpha: 0.6),
                      blurRadius: 10,
                    ),
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          trendColor.withValues(alpha: 0.28),
                          trendColor.withValues(alpha: 0.0),
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

  // Caja derecha: "Ficha del café" con métricas y botón "sumalo a tu pedido"
  Widget _buildInfoCard(BuildContext context, Product p, Color trendColor) {
    final rows = <(String, String, Color?)>[
      ('Categoría', p.category, Colors.white),
      ('Pedidos hoy', p.volume.toString(), Colors.white),
      (
        'Cambio hoy',
        Fmt.pct(p.changePercent24h),
        p.changePercent24h >= 0 ? AppColors.accentPrimary : AppColors.danger,
      ),
      (
        'Cambio semanal',
        Fmt.pct(p.changePercentWeek),
        p.changePercentWeek >= 0 ? AppColors.accentPrimary : AppColors.danger,
      ),
      (
        'Mínimo semanal',
        Fmt.money(p.priceHistory.reduce((a, b) => a < b ? a : b)),
        Colors.white,
      ),
      (
        'Máximo semanal',
        Fmt.money(p.priceHistory.reduce((a, b) => a > b ? a : b)),
        Colors.white,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF161A24),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF232838)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Encabezado con trama sutil decorativa en la esquina superior derecha
          Row(
            children: [
              Text(
                'Ficha del café',
                style: AppStyles.cardTitle(size: 16, color: Colors.white),
              ),
              const Spacer(),
              // Trama de puntos decorativa (como en la imagen 2)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < 4; i++)
                    Padding(
                      padding: const EdgeInsets.only(left: 3),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          for (var j = 0; j < 3; j++)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 3),
                              child: Container(
                                width: 3,
                                height: 3,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.25),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Filas de atributos
          for (final r in rows) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 9),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      r.$1,
                      style: AppStyles.heroBody(color: const Color(0xFF9AA2B3)).copyWith(
                        fontSize: 13,
                        shadows: AppStyles.textShadows(stroke: 0.4),
                      ),
                    ),
                  ),
                  Text(
                    r.$2,
                    style: TextStyle(
                      fontFamily: AppStyles.fontLemonMilk,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: r.$3 ?? Colors.white,
                      letterSpacing: 0.4,
                      shadows: AppStyles.textShadows(stroke: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFF232838)),
          ],
          const SizedBox(height: 22),

          // Fila inferior: "precio actual: $2.80" y botón "sumalo a tu pedido"
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'precio actual:',
                    style: AppStyles.heroBody(color: const Color(0xFF8B92A5)).copyWith(
                      fontSize: 11,
                      shadows: AppStyles.textShadows(stroke: 0.4),
                    ),
                  ),
                  Text(
                    Fmt.money(p.price),
                    style: const TextStyle(
                      fontFamily: AppStyles.fontLemonMilk,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () {
                  context.read<AppState>().addToCart(p.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${p.name} agregado a tu pedido'),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentPrimary,
                  foregroundColor: Colors.black,
                  elevation: 4,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  textStyle: const TextStyle(
                    fontFamily: AppStyles.fontLemonMilk,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('sumalo a tu pedido'),
              ),
            ],
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
        color: const Color(0xFF0F121A),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF232838)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < labels.length; i++)
            GestureDetector(
              onTap: () => onTap(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: i == active
                      ? AppColors.accentPrimary
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  labels[i],
                  style: TextStyle(
                    fontFamily: AppStyles.fontLemonMilk,
                    color: i == active ? Colors.black : const Color(0xFF8B92A5),
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
