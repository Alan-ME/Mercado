import 'package:flutter/material.dart';
import '../models/product.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class ProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback onOrder;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    required this.onOrder,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
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
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            // Efecto de delineado claro al pasar el cursor por arriba
            color: _hover
                ? Colors.white.withValues(alpha: 0.95)
                : border,
            width: _hover ? 1.8 : 1.0,
          ),
          boxShadow: _hover
              ? [
                  BoxShadow(
                    color: Colors.white.withValues(alpha: 0.30),
                    blurRadius: 18,
                    spreadRadius: 1,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: p.accent.withValues(alpha: 0.25),
                    blurRadius: 28,
                    offset: const Offset(0, 8),
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
            borderRadius: BorderRadius.circular(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera: Degradado + Ruido al 40% + Taza desbordando con capa de color al 35% + Badge
                ProductImageHeader(
                  imagePath: p.imagePath ?? 'assets/carta/4.png',
                  accentColor: p.accent,
                  badgeText: p.badge ?? p.category.toUpperCase(),
                  badgeColor: p.accent,
                  height: 120,
                ),

                // Contenido de la tarjeta
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Nombre en mayúsculas
                        Text(
                          p.name.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppStyles.cardTitle(
                            size: 14,
                            color: Theme.of(context).textTheme.titleLarge?.color ?? Colors.white,
                          ),
                        ),
                        const SizedBox(height: 5),

                        // Descripción breve
                        Expanded(
                          child: Text(
                            p.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppStyles.heroBody(
                              color: Theme.of(context).textTheme.bodySmall?.color ?? const Color(0xFF8B92A5),
                            ).copyWith(
                              fontSize: 12,
                              height: 1.3,
                              shadows: AppStyles.textShadows(stroke: 0.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Fila inferior: Precio y Botón Pedir
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              Fmt.money(p.price),
                              style: TextStyle(
                                fontFamily: AppStyles.fontLemonMilk,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.accentPrimary,
                                shadows: AppStyles.textShadows(stroke: 0.8),
                              ),
                            ),
                            const Spacer(),
                            SizedBox(
                              height: 32,
                              child: ElevatedButton.icon(
                                onPressed: widget.onOrder,
                                icon: const Icon(Icons.shopping_cart_outlined, size: 14),
                                label: const Text('Pedir'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accentPrimary,
                                  foregroundColor: Colors.black,
                                  elevation: _hover ? 4 : 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: const TextStyle(
                                    fontFamily: AppStyles.fontLemonMilk,
                                    fontSize: 11,
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
