import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme/app_text_styles.dart';
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

    // Selección de productos destacados exactamente como en la imagen 3:
    // Affogato, Mokaccino, Matcha Latte, Espresso Origen Colombia
    Product findProduct(String id) =>
        app.products.firstWhere((p) => p.id == id, orElse: () => app.products.first);

    final featured = [
      findProduct('p7'), // Affogato
      findProduct('p3'), // Mokaccino
      findProduct('p9'), // Matcha Latte
      findProduct('p1'), // Espresso Origen Colombia
    ];

    final promos = [
      _Promo(
        product: findProduct('p1'),
        title: 'COMBO ESPRESSO + MEDIALUNA',
        tag: 'RECOMENDADO',
        pitch:
            'Doble espresso de origen colombiano con medialuna de manteca recién horneada. La forma clásica de arrancar el día.',
        imagePath: 'assets/carta/1.png',
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFB703), Color(0xFFFB8500)],
        ),
        accentColor: const Color(0xFFFB8500),
        badgeColor: const Color(0xFFE85D04),
        price: 4.90,
      ),
      _Promo(
        product: findProduct('p2'),
        title: 'SÁNDWICH + LATTE',
        tag: 'MEDIODÍA',
        pitch:
            'Sándwich caliente del día acompañado por un latte vainilla. Se sirve hasta las 15h en la barra.',
        imagePath: 'assets/carta/2.png',
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF9D4EDD), Color(0xFF7209B7)],
        ),
        accentColor: const Color(0xFF7C5CFF),
        badgeColor: const Color(0xFF5A189A),
        price: 4.20,
      ),
      _Promo(
        product: findProduct('p3'),
        title: 'MOKACCINO',
        tag: 'RECOMENDADO',
        pitch:
            'Nuestro barista eligió el mokaccino: espresso, chocolate belga y leche cremosa. Se agota rápido, calculá.',
        imagePath: 'assets/carta/3.png',
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF00D9A3), Color(0xFF0077B6)],
        ),
        accentColor: const Color(0xFF00D9A3),
        badgeColor: const Color(0xFF0077B6),
        price: 4.90,
      ),
    ];

    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= 1000;
        final medium = c.maxWidth >= 700;
        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            // Banner animado "BUEN DÍA" con efecto ping-pong
            _AnimatedHero(onExplore: onGoToOrders),
            const SizedBox(height: 32),

            // Sección: Promos de la barra
            const _SectionHeader(
              title: 'Promos de la barra',
              subtitle: 'Combos armados para hoy — ahorrás un poco en el total.',
            ),
            const SizedBox(height: 14),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: wide ? 3 : (medium ? 2 : 1),
              childAspectRatio: wide ? 0.98 : (medium ? 0.92 : 1.3),
              mainAxisSpacing: 18,
              crossAxisSpacing: 18,
              children: [
                for (final promo in promos)
                  _PromoCard(
                    promo: promo,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ProductDetailScreen(product: promo.product),
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
            const SizedBox(height: 36),

            // Sección: Nuestra carta destacada
            _SectionHeader(
              title: 'Nuestra carta destacada',
              subtitle: 'Los favoritos de la semana. Tocá una taza para ver la ficha.',
              trailing: TextButton.icon(
                onPressed: onGoToOrders,
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: Text(
                  'VER TODA LA CARTA',
                  style: TextStyle(
                    fontFamily: AppStyles.fontLemonMilk,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    letterSpacing: 0.8,
                    color: AppColors.accentPrimary,
                    shadows: AppStyles.textShadows(stroke: 0.6),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: wide ? 4 : (c.maxWidth >= 600 ? 2 : 1),
              childAspectRatio: 0.82,
              mainAxisSpacing: 18,
              crossAxisSpacing: 18,
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

            // Banner inferior: Sumate al club de la barra con botón de unirse en la parte verde
            const _ClubBarBanner(),
            const SizedBox(height: 30),
          ],
        );
      },
    );
  }
}

class _Promo {
  final Product product;
  final String title;
  final String tag;
  final String pitch;
  final String imagePath;
  final Gradient gradient;
  final Color accentColor;
  final Color badgeColor;
  final double price;

  const _Promo({
    required this.product,
    required this.title,
    required this.tag,
    required this.pitch,
    required this.imagePath,
    required this.gradient,
    required this.accentColor,
    required this.badgeColor,
    required this.price,
  });
}

/// Hero Banner con animación vertical continua muy muy lenta (efecto ping-pong)
class _AnimatedHero extends StatefulWidget {
  final VoidCallback onExplore;
  const _AnimatedHero({required this.onExplore});

  @override
  State<_AnimatedHero> createState() => _AnimatedHeroState();
}

class _AnimatedHeroState extends State<_AnimatedHero>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    // Animación muy lenta de 20 segundos con efecto ping-pong (arriba y abajo)
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat(reverse: true);

    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutSine,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // 1. Imagen de fondo que se mueve muy lentamente de arriba a abajo (ping-pong)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _animation,
                builder: (context, child) {
                  // Movimiento vertical suave entre -35px y +35px
                  final offset = (_animation.value * 70.0) - 35.0;
                  return Transform.translate(
                    offset: Offset(0, offset),
                    child: Transform.scale(
                      scale: 1.28, // Escala para permitir traslación sin bordes vacíos
                      child: Image.asset(
                        'assets/carta/fondo banner.png',
                        fit: BoxFit.cover,
                        alignment: Alignment.center,
                      ),
                    ),
                  );
                },
              ),
            ),

            // 2. Capa oscura frontal con gradiente para garantizar máxima legibilidad
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      Colors.black.withValues(alpha: 0.90),
                      Colors.black.withValues(alpha: 0.72),
                      Colors.black.withValues(alpha: 0.45),
                    ],
                  ),
                ),
              ),
            ),

            // 3. Contenido tipográfico y botones
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 26),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // "BUEN DÍA" en Bebas Neue
                        Text(
                          'BUEN DÍA',
                          style: AppStyles.heroTitle(color: const Color(0xFFFFB703)),
                        ),
                        const SizedBox(height: 4),

                        // "HOY HAY CAFÉ RECIÉN TOSTADO." en Lemon Milk Medium / Bold
                        Text(
                          'HOY HAY CAFÉ RECIÉN TOSTADO.',
                          style: AppStyles.heroSubtitle(color: Colors.white),
                        ),
                        const SizedBox(height: 8),

                        // "Elegí tu combo, sumá..." en Nirmala UI
                        SizedBox(
                          width: 580,
                          child: Text(
                            'Elegí tu combo, sumá algún dulce o entrá directo a la carta. '
                            'Cada taza se prepara al momento: pedí y pasá a buscar por la barra.',
                            style: AppStyles.heroBody(color: const Color(0xFFE0E5EC)),
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Botones de acción
                        Row(
                          children: [
                            ElevatedButton.icon(
                              onPressed: widget.onExplore,
                              icon: const Icon(Icons.menu_book_outlined, size: 16),
                              label: const Text('VER LA CARTA'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF00D9A3),
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                                textStyle: const TextStyle(
                                  fontFamily: AppStyles.fontLemonMilk,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  letterSpacing: 0.8,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            OutlinedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Tostado de la semana: Mokaccino de origen selecto'),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.local_fire_department_outlined, size: 16, color: Colors.white),
                              label: Text(
                                'TOSTADO DE LA SEMANA',
                                style: TextStyle(
                                  fontFamily: AppStyles.fontLemonMilk,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  letterSpacing: 0.8,
                                  color: Colors.white,
                                  shadows: AppStyles.textShadows(stroke: 0.6),
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Colors.white, width: 1.2),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Gráfico estilizado "COFFEE TRADING" a la derecha (como en la imagen 3)
                  if (MediaQuery.of(context).size.width >= 960)
                    const Padding(
                      padding: EdgeInsets.only(right: 20),
                      child: _CoffeeTradingGraphic(),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Gráfico de marca a la derecha del banner: taza de café con gráfico de trading
class _CoffeeTradingGraphic extends StatelessWidget {
  const _CoffeeTradingGraphic();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            // Resplandor
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.18),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            // Gráfico de líneas y barras sobre la taza
            Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(width: 6, height: 16, color: Colors.white.withValues(alpha: 0.9)),
                    const SizedBox(width: 4),
                    Container(width: 6, height: 28, color: Colors.white.withValues(alpha: 0.9)),
                    const SizedBox(width: 4),
                    Container(width: 6, height: 42, color: Colors.white.withValues(alpha: 0.9)),
                  ],
                ),
                const SizedBox(height: 6),
                Icon(
                  Icons.local_cafe,
                  size: 58,
                  color: Colors.white.withValues(alpha: 0.95),
                  shadows: AppStyles.textShadows(stroke: 1.2),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'COFFEE TRADING',
          style: TextStyle(
            fontFamily: AppStyles.fontLemonMilk,
            fontSize: 14,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.6,
            color: Colors.white,
            shadows: AppStyles.textShadows(),
          ),
        ),
        Text(
          'TAGLINE HERE',
          style: TextStyle(
            fontFamily: AppStyles.fontNirmala,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.8,
            color: Colors.white.withValues(alpha: 0.75),
            shadows: AppStyles.textShadows(stroke: 0.5),
          ),
        ),
      ],
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
              Text(
                title,
                style: AppStyles.heroSubtitle(
                  color: Theme.of(context).textTheme.headlineMedium?.color ?? Colors.white,
                ).copyWith(fontSize: 20),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: AppStyles.heroBody(
                  color: Theme.of(context).textTheme.bodyMedium?.color ?? const Color(0xFF8B92A5),
                ).copyWith(fontSize: 13, shadows: AppStyles.textShadows(stroke: 0.4)),
              ),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

/// Tarjeta de promo con cabecera de degradado + ruido al 40% + taza sobrepasando al 35% de color + delineado en hover
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
    final surface = Theme.of(context).cardColor;
    final border = Theme.of(context).dividerColor;

    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        transform: _hover
            ? Matrix4.translationValues(0.0, -4.0, 0.0)
            : Matrix4.identity(),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            // "el efecto de delineado claro que tiene al rededor se genera en todos los demas elementos si se pasa el cursor por arriba"
            color: _hover
                ? Colors.white.withValues(alpha: 0.95)
                : border,
            width: _hover ? 2.0 : 1.0,
          ),
          boxShadow: _hover
              ? [
                  BoxShadow(
                    color: Colors.white.withValues(alpha: 0.35),
                    blurRadius: 20,
                    spreadRadius: 1,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: promo.accentColor.withValues(alpha: 0.30),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap,
            borderRadius: BorderRadius.circular(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera de la promo: degradado + ruido 40% + imagen sobrepasada con color al 35% + badge
                ProductImageHeader(
                  imagePath: promo.imagePath,
                  accentColor: promo.accentColor,
                  gradient: promo.gradient,
                  badgeText: promo.tag,
                  badgeColor: promo.badgeColor,
                  height: 140,
                ),

                // Cuerpo de la tarjeta
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          promo.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppStyles.cardTitle(
                            size: 15,
                            color: Theme.of(context).textTheme.titleLarge?.color ?? Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Expanded(
                          child: Text(
                            promo.pitch,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: AppStyles.heroBody(
                              color: Theme.of(context).textTheme.bodySmall?.color ?? const Color(0xFF8B92A5),
                            ).copyWith(
                              fontSize: 12,
                              height: 1.35,
                              shadows: AppStyles.textShadows(stroke: 0.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              Fmt.money(promo.price),
                              style: TextStyle(
                                fontFamily: AppStyles.fontLemonMilk,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.accentPrimary,
                                shadows: AppStyles.textShadows(stroke: 0.8),
                              ),
                            ),
                            const Spacer(),
                            SizedBox(
                              height: 34,
                              child: ElevatedButton.icon(
                                onPressed: widget.onOrder,
                                icon: const Icon(Icons.shopping_cart_outlined, size: 15),
                                label: const Text('Pedir'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accentPrimary,
                                  foregroundColor: Colors.black,
                                  elevation: _hover ? 4 : 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 14),
                                  textStyle: const TextStyle(
                                    fontFamily: AppStyles.fontLemonMilk,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
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
          ),
        ),
      ),
    );
  }
}

/// Banner inferior: Club de la barra con botón de unirse en la parte verde
class _ClubBarBanner extends StatelessWidget {
  const _ClubBarBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Color(0xFF0F131C),
            Color(0xFF131A26),
            Color(0xFF00382B),
            Color(0xFF00D9A3),
          ],
          stops: [0.0, 0.45, 0.70, 1.0],
        ),
        border: Border.all(color: const Color(0xFF00D9A3).withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00D9A3).withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '¿Querés sumarte al club de la barra?',
                    style: AppStyles.cardTitle(
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Creá tu cuenta y guardá tus favoritos. Te avisamos cuando bajan de precio o entra una nueva partida.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppStyles.heroBody(color: const Color(0xFFC4D1DE)).copyWith(
                      fontSize: 13,
                      shadows: AppStyles.textShadows(stroke: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),

            // "al queres sumarte al club de la barra agregale un boton de unirse en la parte verde"
            ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('¡Bienvenido al Club de la Barra! Beneficios activados.'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
              icon: const Icon(Icons.stars, color: Colors.black, size: 18),
              label: const Text('UNIRSE'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                elevation: 6,
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                textStyle: const TextStyle(
                  fontFamily: AppStyles.fontLemonMilk,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.0,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
