import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
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
    final categories =
        <String>{'Todos', ...app.products.map((e) => e.category)}.toList();

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
          padding: const EdgeInsets.all(24),
          children: [
            Text('La carta', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 4),
            Text('Carta viva — los precios se ajustan con la demanda del día.',
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 20),
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
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.search_off,
                          size: 44, color: Theme.of(context).dividerColor),
                      const SizedBox(height: 12),
                      Text('No hay productos que coincidan',
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              )
            else
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: crossAxis,
                childAspectRatio: 0.92,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  for (final p in list) _cardFor(p),
                ],
              ),
          ],
        );
      },
    );
  }

  Widget _cardFor(Product p) {
    return ProductCard(
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
              label: 'Ver',
              onPressed: () => Scaffold.of(context).openEndDrawer(),
            ),
          ),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          SizedBox(
            width: 260,
            child: TextField(
              onChanged: onQuery,
              decoration: const InputDecoration(
                hintText: 'Buscar café o especial…',
                prefixIcon: Icon(Icons.search),
                isDense: true,
              ),
            ),
          ),
          _Segmented(
            values: categories,
            active: category,
            onTap: onCategory,
          ),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: sort,
            underline: const SizedBox.shrink(),
            icon: const Icon(Icons.arrow_drop_down, size: 20),
            style: Theme.of(context).textTheme.bodyMedium,
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
  const _Segmented(
      {required this.values, required this.active, required this.onTap});

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
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.accentPrimary.withValues(alpha: 0.15)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(7),
              ),
              child: Text(
                v,
                style: TextStyle(
                  color: isActive ? AppColors.accentPrimary : null,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
