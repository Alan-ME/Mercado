import 'package:flutter/material.dart';

/// Paleta pensada como plataforma de trading.
/// Los colores no son "cafeteros": son neutros/oscuros con acentos de mercado
/// (verde = sube, rojo = baja). Cambiar los productos por criptos o acciones
/// no rompe la identidad visual.
class AppColors {
  // Dark
  static const bgDark = Color(0xFF0B0E14);
  static const surfaceDark = Color(0xFF13161F);
  static const elevatedDark = Color(0xFF1A1E29);
  static const borderDark = Color(0xFF252A38);
  static const textPrimaryDark = Color(0xFFE4E7EB);
  static const textSecondaryDark = Color(0xFF8B92A5);

  // Light
  static const bgLight = Color(0xFFF5F7FB);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const elevatedLight = Color(0xFFF0F3F8);
  static const borderLight = Color(0xFFE1E6EF);
  static const textPrimaryLight = Color(0xFF1A1D26);
  static const textSecondaryLight = Color(0xFF60687A);

  // Accents (mercado)
  static const accentPrimary = Color(0xFF00D9A3); // mint / long
  static const accentSecondary = Color(0xFF7C5CFF); // violet
  static const success = Color(0xFF22C55E);
  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const info = Color(0xFF3B82F6);
}

class AppTheme {
  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bgDark,
      colorScheme: const ColorScheme.dark(
        surface: AppColors.surfaceDark,
        primary: AppColors.accentPrimary,
        secondary: AppColors.accentSecondary,
        error: AppColors.danger,
        onPrimary: Colors.black,
      ),
      cardColor: AppColors.surfaceDark,
      dividerColor: AppColors.borderDark,
      textTheme: _textTheme(AppColors.textPrimaryDark, AppColors.textSecondaryDark),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgDark,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.textPrimaryDark),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimaryDark,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: _inputTheme(
        fill: AppColors.elevatedDark,
        border: AppColors.borderDark,
        hint: AppColors.textSecondaryDark,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentPrimary,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.3),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimaryDark,
          side: const BorderSide(color: AppColors.borderDark),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: AppColors.elevatedDark,
        contentTextStyle: TextStyle(color: AppColors.textPrimaryDark),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bgLight,
      colorScheme: const ColorScheme.light(
        surface: AppColors.surfaceLight,
        primary: Color(0xFF00B386),
        secondary: AppColors.accentSecondary,
        error: AppColors.danger,
        onPrimary: Colors.white,
      ),
      cardColor: AppColors.surfaceLight,
      dividerColor: AppColors.borderLight,
      textTheme: _textTheme(AppColors.textPrimaryLight, AppColors.textSecondaryLight),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgLight,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.textPrimaryLight),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimaryLight,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: _inputTheme(
        fill: AppColors.elevatedLight,
        border: AppColors.borderLight,
        hint: AppColors.textSecondaryLight,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00B386),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.3),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimaryLight,
          side: const BorderSide(color: AppColors.borderLight),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: AppColors.elevatedLight,
        contentTextStyle: TextStyle(color: AppColors.textPrimaryLight),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static TextTheme _textTheme(Color primary, Color secondary) {
    return TextTheme(
      displayLarge: TextStyle(color: primary, fontSize: 48, fontWeight: FontWeight.w800, letterSpacing: -1),
      displayMedium: TextStyle(color: primary, fontSize: 36, fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineLarge: TextStyle(color: primary, fontSize: 28, fontWeight: FontWeight.w700),
      headlineMedium: TextStyle(color: primary, fontSize: 22, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(color: primary, fontSize: 18, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(color: primary, fontSize: 15, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: primary, fontSize: 15),
      bodyMedium: TextStyle(color: secondary, fontSize: 14),
      bodySmall: TextStyle(color: secondary, fontSize: 12),
      labelLarge: TextStyle(color: primary, fontSize: 14, fontWeight: FontWeight.w600),
      labelSmall: TextStyle(color: secondary, fontSize: 11, letterSpacing: 0.6, fontWeight: FontWeight.w600),
    );
  }

  static InputDecorationTheme _inputTheme({required Color fill, required Color border, required Color hint}) {
    return InputDecorationTheme(
      filled: true,
      fillColor: fill,
      hintStyle: TextStyle(color: hint, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.accentPrimary, width: 1.5),
      ),
    );
  }
}
