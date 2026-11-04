import 'package:flutter/material.dart';

class AppStyles {
  // Font family names
  static const fontBebas = 'Bebas Neue';
  static const fontLemonMilk = 'Lemon Milk';
  static const fontNirmala = 'Nirmala UI';

  /// Genera delineado perimetral de 1px más sombra para cumplir con la especificación:
  /// "todos los textos tienen un delineado de 1px y un efecto de sombra sobre las letras"
  static List<Shadow> textShadows({
    Color outlineColor = const Color(0xFF000000),
    Color shadowColor = const Color(0xDD000000),
    double stroke = 1.0,
  }) {
    return [
      Shadow(offset: Offset(-stroke, -stroke), color: outlineColor),
      Shadow(offset: Offset(stroke, -stroke), color: outlineColor),
      Shadow(offset: Offset(-stroke, stroke), color: outlineColor),
      Shadow(offset: Offset(stroke, stroke), color: outlineColor),
      Shadow(offset: Offset(-stroke, 0), color: outlineColor),
      Shadow(offset: Offset(stroke, 0), color: outlineColor),
      Shadow(offset: Offset(0, -stroke), color: outlineColor),
      Shadow(offset: Offset(0, stroke), color: outlineColor),
      Shadow(offset: const Offset(0, 2), blurRadius: 4, color: shadowColor),
    ];
  }

  /// Estilo para "BUEN DÍA"
  static TextStyle heroTitle({Color color = Colors.white}) {
    return TextStyle(
      fontFamily: fontBebas,
      fontSize: 54,
      fontWeight: FontWeight.w400,
      letterSpacing: 1.5,
      color: color,
      height: 1.05,
      shadows: textShadows(),
    );
  }

  /// Estilo para "HOY HAY CAFÉ RECIÉN TOSTADO"
  static TextStyle heroSubtitle({Color color = const Color(0xFFFFB703)}) {
    return TextStyle(
      fontFamily: fontLemonMilk,
      fontSize: 22,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.8,
      color: color,
      shadows: textShadows(),
    );
  }

  /// Estilo para texto descriptivo "Elegí tu combo, sumá..."
  static TextStyle heroBody({Color color = Colors.white}) {
    return TextStyle(
      fontFamily: fontNirmala,
      fontSize: 15,
      fontWeight: FontWeight.w500,
      height: 1.45,
      color: color,
      shadows: textShadows(stroke: 0.8),
    );
  }

  /// Estilo para títulos de tarjetas en mayúsculas
  static TextStyle cardTitle({Color color = Colors.white, double size = 15}) {
    return TextStyle(
      fontFamily: fontLemonMilk,
      fontSize: size,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.5,
      color: color,
      shadows: textShadows(stroke: 0.8),
    );
  }

  /// Estilo para textos en general con delineado y sombra
  static TextStyle text({
    String? fontFamily = fontNirmala,
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w600,
    Color color = Colors.white,
    double? height,
    double stroke = 0.8,
  }) {
    return TextStyle(
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      height: height,
      shadows: textShadows(stroke: stroke),
    );
  }
}

/// Contenedor de cabecera con degradado de color vibrante, capa de ruido al 40%
/// con efecto de saturación, y elemento de imagen que sobrepasa el fondo con capa de color al 35%.
class ProductImageHeader extends StatelessWidget {
  final String imagePath;
  final Color accentColor;
  final Gradient? gradient;
  final String? badgeText;
  final Color? badgeColor;
  final double height;

  const ProductImageHeader({
    super.key,
    required this.imagePath,
    required this.accentColor,
    this.gradient,
    this.badgeText,
    this.badgeColor,
    this.height = 130,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveGradient = gradient ??
        LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            accentColor.withValues(alpha: 0.95),
            accentColor.withValues(alpha: 0.70),
          ],
        );

    return SizedBox(
      height: height,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // 1. Degradado base con bordes redondeados superiores
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                gradient: effectiveGradient,
              ),
            ),
          ),

          // 2. Capa de ruido al 40% de opacidad con saturación
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              child: Opacity(
                opacity: 0.40,
                child: Image.asset(
                  'assets/images/noise.png',
                  repeat: ImageRepeat.repeat,
                  fit: BoxFit.none,
                  color: Colors.white,
                  colorBlendMode: BlendMode.saturation,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            ),
          ),

          // 3. Taza/comida que sobrepasa un poco el fondo + capa de color al 35% de opacidad
          Positioned(
            left: 0,
            right: 0,
            top: -12,
            bottom: -12,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Imagen principal
                  Image.asset(
                    imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Icon(
                      Icons.local_cafe,
                      size: 56,
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),

                  // Capa de color al 35% de opacidad sobre la imagen
                  Positioned.fill(
                    child: ClipRect(
                      child: ColorFiltered(
                        colorFilter: ColorFilter.mode(
                          accentColor.withValues(alpha: 0.35),
                          BlendMode.srcATop,
                        ),
                        child: Image.asset(
                          imagePath,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 4. Badge (ej: "RECOMENDADO", "POSTRES", "CON LECHE", "FRÍO", "ESPRESSO")
          if (badgeText != null && badgeText!.isNotEmpty)
            Positioned(
              right: 12,
              bottom: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor ?? accentColor.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  badgeText!,
                  style: const TextStyle(
                    fontFamily: AppStyles.fontLemonMilk,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.0,
                    color: Colors.white,
                    shadows: [
                      Shadow(offset: Offset(0, 1), blurRadius: 2, color: Colors.black),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
