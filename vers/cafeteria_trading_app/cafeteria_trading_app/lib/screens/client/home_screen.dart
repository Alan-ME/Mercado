import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/product_card.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onGoToOrders;
  const HomeScreen({super.key, required this.onGoToOrders});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final trending = List.of(app.products)
      ..sort((a, b) => b.changePercentWeek.compareTo(a.changePercentWeek));
    final promos = _buildPromos(trending);
    final featured = trending.take(4).toList();

    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= 1000;
        final medium = c.maxWidth >= 700;
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _Hero(onExplore: onGoToOrders),
            const SizedBox(height: 32),
            const _SectionHeader(
              title: 'Promos de la barra',
              subtitle:
                  'Combos armados para hoy — abrí una para ver el detalle.',
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: wide ? 3 : (medium ? 2 : 1),
              childAspectRatio: wide ? 1.15 : (medium ? 1.05 : 1.5),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                for (final promo in promos)
                  _PromoCard(
                    promo: promo,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            ProductDetailScreen(product: promo.product),
                      ),
                    ),
                    onOrder: () {
                      context.read<AppState>().addToCart(promo.product.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${promo.title} agregado al pedido'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
              ],
            ),
            const SizedBox(height: 32),
            _SectionHeader(
              title: 'Nuestra carta destacada',
              subtitle:
                  'Los favoritos de la semana. Tocá una taza para ver la ficha.',
              trailing: TextButton.icon(
                onPressed: onGoToOrders,
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: const Text('Ver toda la carta'),
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: wide ? 4 : (c.maxWidth >= 600 ? 2 : 1),
              childAspectRatio: 0.95,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                for (final p in featured)
                  ProductCard(
                    product: p,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ProductDetailScreen(product: p),
                      ),
                    ),
                    onOrder: () {
                      context.read<AppState>().addToCart(p.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${p.name} agregado al carrito'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
              ],
            ),
            const SizedBox(height: 40),
            _FooterBanner(),
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }

  List<_Promo> _buildPromos(List<Product> trending) {
    Product pick(String preferredId) {
      return trending.firstWhere(
        (p) => p.id == preferredId,
        orElse: () => trending.first,
      );
    }

    return [
      _Promo(
        product: pick('p1'),
        title: 'Combo Espresso + Medialuna',
        tag: 'DESAYUNO',
        pitch:
            'Doble espresso de origen colombiano con medialuna de manteca recién horneada. La forma cortita de arrancar el día.',
        cupIcon: Icons.free_breakfast_outlined,
        cupColor: AppColors.warning,
      ),
      _Promo(
        product: pick('p2'),
        title: 'Plato del día — Sándwich + Latte',
        tag: 'MEDIODÍA',
        pitch:
            'Sándwich caliente del día acompañado por un latte vainilla. Se sirve hasta las 15h en la barra.',
        cupIcon: Icons.restaurant_menu,
        cupColor: AppColors.accentSecondary,
      ),
      _Promo(
        product: pick('p3'),
        title: 'Tostado de la semana — Mokaccino',
        tag: 'RECOMENDADO',
        pitch:
            'Nuestro barista eligió el mokaccino: espresso, chocolate belga y leche cremosa. Se agota rápido, calculá.',
        cupIcon: Icons.emoji_food_beverage_outlined,
        cupColor: AppColors.accentPrimary,
      ),
    ];
  }
}

class _Promo {
  final Product product;
  final String title;
  final String tag;
  final String pitch;
  final IconData cupIcon;
  final Color cupColor;
  const _Promo({
    required this.product,
    required this.title,
    required this.tag,
    required this.pitch,
    required this.cupIcon,
    required this.cupColor,
  });
}

class _Hero extends StatelessWidget {
  final VoidCallback onExplore;
  const _Hero({required this.onExplore});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(36),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.warning.withValues(alpha: 0.18),
            AppColors.accentPrimary.withValues(alpha: 0.08),
          ],
        ),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.warning.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                            color: AppColors.success, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'BARRA ABIERTA · HOY',
                        style: TextStyle(
                          color: AppColors.warning,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Buen día.\nHoy hay café recién tostado.',
                  style: Theme.of(context).textTheme.displayMedium,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: 520,
                  child: Text(
                    'Elegí tu combo, sumá algo dulce o entrá directo a la carta. '
                    'Cada taza se prepara al momento — pedí y pasá a buscar por la barra.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(height: 1.55),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: onExplore,
                      icon: const Icon(Icons.menu_book_outlined),
                      label: const Text('Ver la carta'),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content:
                                Text('Acción simulada — pendiente backend'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.local_fire_department_outlined,
                          size: 18),
                      label: const Text('Tostado de la semana'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (MediaQuery.of(context).size.width >= 900)
            const Expanded(child: _HeroArt()),
        ],
      ),
    );
  }
}

class _HeroArt extends StatelessWidget {
  const _HeroArt();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        height: 220,
        width: 220,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.warning.withValues(alpha: 0.28),
                    AppColors.warning.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
            Icon(
              Icons.coffee_outlined,
              size: 130,
              color: AppColors.warning.withValues(alpha: 0.9),
            ),
            Positioned(
              top: 22,
              right: 46,
              child: Icon(
                Icons.blur_on,
                size: 44,
                color: Theme.of(context).dividerColor.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? trailing;
  const _SectionHeader({
    required this.title,
    required this.subtitle,
    this.trailing,
  });
  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 2),
              Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _PromoCard extends StatefulWidget {
  final _Promo promo;
  final VoidCallback onTap;
  final VoidCallback onOrder;
  const _PromoCard({
    required this.promo,
    required this.onTap,
    required this.onOrder,
  });
  @override
  State<_PromoCard> createState() => _PromoCardState();
}

class _PromoCardState extends State<_PromoCard> {
  bool _hover = false;
  @override
  Widget build(BuildContext context) {
    final promo = widget.promo;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        transform: _hover
            ? (Matrix4.identity()..translate(0.0, -4.0))
            : Matrix4.identity(),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              promo.cupColor.withValues(alpha: isDark ? 0.22 : 0.14),
              promo.cupColor.withValues(alpha: isDark ? 0.08 : 0.04),
            ],
          ),
          border: Border.all(
            color: _hover
                ? promo.cupColor.withValues(alpha: 0.6)
                : Theme.of(context).dividerColor,
          ),
          boxShadow: _hover
              ? [
                  BoxShadow(
                    color: promo.cupColor
                        .withValues(alpha: isDark ? 0.20 : 0.12),
                    blurRadius: 22,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: promo.cupColor.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          promo.tag,
                          style: TextStyle(
                            color: promo.cupColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Icon(promo.cupIcon,
                          color: promo.cupColor.withValues(alpha: 0.9),
                          size: 40),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(promo.title,
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Expanded(
                    child: Text(
                      promo.pitch,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(height: 1.45),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Fmt.money(promo.product.price),
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                      const Spacer(),
                      SizedBox(
                        height: 34,
                        child: ElevatedButton.icon(
                          onPressed: widget.onOrder,
                          icon: const Icon(Icons.shopping_cart_outlined,
                              size: 16),
                          label: const Text('Pedir'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            textStyle: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FooterBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            AppColors.accentPrimary.withValues(alpha: 0.12),
            AppColors.accentSecondary.withValues(alpha: 0.12),
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
                Text('¿Querés sumarte al club de la barra?',
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 6),
                Text(
                  'Creá tu cuenta y guardá tus favoritos. Te avisamos cuando bajan de precio o entra una nueva partida.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Acción simulada — pendiente backend')),
              );
            },
            icon: const Icon(Icons.card_membership_outlined),
            label: const Text('Sumarme'),
          ),
        ],
      ),
    );
  }
}
