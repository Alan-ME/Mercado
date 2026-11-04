import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_text_styles.dart';
import '../../theme/app_theme.dart';
import '../../widgets/product_card.dart';
import 'product_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  String _query = '';
  String _category = 'Todos';
  String _sort = 'Más subieron hoy';

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final categories = <String>['Todos', 'Espresso', 'Con leche', 'Frío', 'Postres'];

    var list = app.products.where((p) {
      final matchCat = _category == 'Todos' || p.category == _category;
      final matchQ = _query.isEmpty ||
          p.name.toLowerCase().contains(_query.toLowerCase()) ||
          p.symbol.toLowerCase().contains(_query.toLowerCase());
      return matchCat && matchQ;
    }).toList();

    switch (_sort) {
      case 'Más subieron hoy':
        list.sort((a, b) => b.changePercent24h.compareTo(a.changePercent24h));
        break;
      case 'Más bajaron hoy':
        list.sort((a, b) => a.changePercent24h.compareTo(b.changePercent24h));
        break;
      case 'Precio: bajo a alto':
        list.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'Precio: alto a bajo':
        list.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'Más pedidos':
        list.sort((a, b) => b.volume.compareTo(a.volume));
        break;
    }

    return LayoutBuilder(
      builder: (context, c) {
        final crossAxis = c.maxWidth >= 1200
            ? 4
            : c.maxWidth >= 900
                ? 3
                : c.maxWidth >= 600
                    ? 2
                    : 1;

        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            // Título y subtítulo con delineado 1px y sombra
            Text(
              'La carta',
              style: AppStyles.heroSubtitle(
                color: Theme.of(context).textTheme.headlineLarge?.color ?? Colors.white,
              ).copyWith(fontSize: 28),
            ),
            const SizedBox(height: 4),
            Text(
              'Consulta los precios en vivo de nuestras especialidades — Carta viva.',
              style: AppStyles.heroBody(
                color: Theme.of(context).textTheme.bodyMedium?.color ?? const Color(0xFF8B92A5),
              ).copyWith(fontSize: 13, shadows: AppStyles.textShadows(stroke: 0.4)),
            ),
            const SizedBox(height: 20),

            // Barra de filtros
            _FilterBar(
              query: _query,
              category: _category,
              categories: categories,
              sort: _sort,
              onQuery: (v) => setState(() => _query = v),
              onCategory: (v) => setState(() => _category = v),
              onSort: (v) => setState(() => _sort = v),
            ),
            const SizedBox(height: 20),

            if (list.isEmpty)
              Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.search_off, size: 48, color: Theme.of(context).dividerColor),
                      const SizedBox(height: 12),
                      Text(
                        'No hay productos que coincidan con la búsqueda',
                        style: AppStyles.heroBody(
                          color: Theme.of(context).textTheme.bodyMedium?.color ?? const Color(0xFF8B92A5),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              // Cuadrícula con las mini-tarjetas completas (reemplazando los recuadros anteriores)
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: crossAxis,
                childAspectRatio: 0.82,
                mainAxisSpacing: 18,
                crossAxisSpacing: 18,
                children: [
                  for (final p in list)
                    ProductCard(
                      product: p,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                      ),
                      onOrder: () {
                        context.read<AppState>().addToCart(p.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${p.name} agregado al carrito'),
                            duration: const Duration(seconds: 1),
                            action: SnackBarAction(
                              label: 'Ver carrito',
                              textColor: AppColors.accentPrimary,
                              onPressed: () => Scaffold.of(context).openEndDrawer(),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            const SizedBox(height: 30),
          ],
        );
      },
    );
  }
}

class _FilterBar extends StatelessWidget {
  final String query;
  final String category;
  final List<String> categories;
  final String sort;
  final ValueChanged<String> onQuery;
  final ValueChanged<String> onCategory;
  final ValueChanged<String> onSort;

  const _FilterBar({
    required this.query,
    required this.category,
    required this.categories,
    required this.sort,
    required this.onQuery,
    required this.onCategory,
    required this.onSort,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Wrap(
        spacing: 14,
        runSpacing: 12,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          SizedBox(
            width: 260,
            child: TextField(
              onChanged: onQuery,
              decoration: const InputDecoration(
                hintText: 'Buscar café o especial…',
                prefixIcon: Icon(Icons.search, size: 18),
                isDense: true,
              ),
            ),
          ),
          _Segmented(
            values: categories,
            active: category,
            onTap: onCategory,
          ),
          const SizedBox(width: 6),
          DropdownButton<String>(
            value: sort,
            underline: const SizedBox.shrink(),
            icon: const Icon(Icons.arrow_drop_down, size: 20),
            style: TextStyle(
              fontFamily: AppStyles.fontNirmala,
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: Theme.of(context).textTheme.bodyMedium?.color,
            ),
            items: const [
              'Más subieron hoy',
              'Más bajaron hoy',
              'Precio: bajo a alto',
              'Precio: alto a bajo',
              'Más pedidos',
            ].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => v == null ? null : onSort(v),
          ),
        ],
      ),
    );
  }
}

class _Segmented extends StatelessWidget {
  final List<String> values;
  final String active;
  final ValueChanged<String> onTap;

  const _Segmented({
    required this.values,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: values.map((v) {
          final isActive = v == active;
          return GestureDetector(
            onTap: () => onTap(v),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.accentPrimary.withValues(alpha: 0.18)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(7),
                border: Border.all(
                  color: isActive
                      ? AppColors.accentPrimary.withValues(alpha: 0.5)
                      : Colors.transparent,
                ),
              ),
              child: Text(
                v,
                style: TextStyle(
                  fontFamily: AppStyles.fontLemonMilk,
                  color: isActive
                      ? AppColors.accentPrimary
                      : Theme.of(context).textTheme.bodyMedium?.color,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  shadows: isActive ? AppStyles.textShadows(stroke: 0.5) : null,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
