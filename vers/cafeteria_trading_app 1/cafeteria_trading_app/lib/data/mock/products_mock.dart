import 'package:flutter/material.dart';
import '../../models/product.dart';

/// Datos simulados. Cuando entre el backend real, reemplazar esta lista
/// por un fetch a la API — todo el resto de la app consume `Product`.
class ProductsMock {
  static final List<Product> all = [
    Product(
      id: 'p1',
      name: 'Espresso Origen Colombia',
      symbol: 'ESP',
      category: 'Espresso',
      badge: 'ESPRESSO',
      imagePath: 'assets/carta/4.png',
      description: 'Extracción corta, notas a cacao y nuez. Cuerpo alto.',
      price: 2.80,
      changePercent24h: 2.4,
      changePercentWeek: 8.1,
      priceHistory: _series(2.60, 2.80, seed: 1),
      icon: Icons.local_cafe_outlined,
      accent: const Color(0xFF00D9A3),
      volume: 342,
    ),
    Product(
      id: 'p2',
      name: 'Latte Vainilla',
      symbol: 'LAT',
      category: 'Con leche',
      badge: 'CON LECHE',
      imagePath: 'assets/carta/latte_vainilla.png',
      description: 'Leche vaporizada, jarabe de vainilla natural, arte latte.',
      price: 4.20,
      changePercent24h: -1.1,
      changePercentWeek: 3.6,
      priceHistory: _series(4.35, 4.20, seed: 2),
      icon: Icons.coffee_outlined,
      accent: const Color(0xFF7C5CFF),
      volume: 512,
    ),
    Product(
      id: 'p3',
      name: 'Mokaccino',
      symbol: 'MOK',
      category: 'Con leche',
      badge: 'CON LECHE',
      imagePath: 'assets/carta/6.png',
      description: 'Mezcla de espresso, chocolate belga y leche cremosa.',
      price: 4.90,
      changePercent24h: 5.7,
      changePercentWeek: 12.4,
      priceHistory: _series(4.30, 4.90, seed: 3),
      icon: Icons.emoji_food_beverage_outlined,
      accent: const Color(0xFFE85D04),
      volume: 289,
    ),
    Product(
      id: 'p4',
      name: 'Cold Brew 24h',
      symbol: 'CBR',
      category: 'Frío',
      badge: 'FRÍO',
      imagePath: 'assets/carta/cold_brew.png',
      description: 'Infusión en frío 24 horas. Dulzor natural, bajo en acidez.',
      price: 5.50,
      changePercent24h: -3.2,
      changePercentWeek: -1.8,
      priceHistory: _series(5.80, 5.50, seed: 4),
      icon: Icons.ac_unit_outlined,
      accent: const Color(0xFF00B4D8),
      volume: 174,
    ),
    Product(
      id: 'p5',
      name: 'Flat White',
      symbol: 'FLW',
      category: 'Con leche',
      badge: 'CON LECHE',
      imagePath: 'assets/carta/flat_white.png',
      description: 'Doble ristretto y microespuma sedosa. Estilo australiano.',
      price: 4.60,
      changePercent24h: 1.6,
      changePercentWeek: 4.2,
      priceHistory: _series(4.50, 4.60, seed: 5),
      icon: Icons.local_drink_outlined,
      accent: const Color(0xFF00B386),
      volume: 401,
    ),
    Product(
      id: 'p6',
      name: 'Cappuccino Clásico',
      symbol: 'CAP',
      category: 'Con leche',
      badge: 'CON LECHE',
      imagePath: 'assets/carta/cappuccino.png',
      description: 'Un tercio espresso, un tercio leche, un tercio espuma.',
      price: 3.80,
      changePercent24h: 0.8,
      changePercentWeek: 2.1,
      priceHistory: _series(3.75, 3.80, seed: 6),
      icon: Icons.coffee_maker_outlined,
      accent: const Color(0xFF22C55E),
      volume: 623,
    ),
    Product(
      id: 'p7',
      name: 'Affogato',
      symbol: 'AFF',
      category: 'Postres',
      badge: 'POSTRES',
      imagePath: 'assets/carta/7.png',
      description: 'Helado de vainilla ahogado en espresso recién extraído.',
      price: 6.20,
      changePercent24h: 7.3,
      changePercentWeek: 15.8,
      priceHistory: _series(5.20, 6.20, seed: 7),
      icon: Icons.icecream_outlined,
      accent: const Color(0xFFEF4444),
      volume: 132,
    ),
    Product(
      id: 'p8',
      name: 'Americano Doble',
      symbol: 'AME',
      category: 'Espresso',
      badge: 'ESPRESSO',
      imagePath: 'assets/carta/americano.png',
      description: 'Doble espresso con agua caliente. Perfil limpio y directo.',
      price: 3.20,
      changePercent24h: -0.6,
      changePercentWeek: 1.4,
      priceHistory: _series(3.25, 3.20, seed: 8),
      icon: Icons.coffee,
      accent: const Color(0xFF8B92A5),
      volume: 478,
    ),
    Product(
      id: 'p9',
      name: 'Matcha Latte',
      symbol: 'MAT',
      category: 'Frío',
      badge: 'FRÍO',
      imagePath: 'assets/carta/5.png',
      description: 'Té matcha ceremonial batido con leche vaporizada.',
      price: 5.10,
      changePercent24h: 3.9,
      changePercentWeek: 9.2,
      priceHistory: _series(4.70, 5.10, seed: 9),
      icon: Icons.eco_outlined,
      accent: const Color(0xFF38B000),
      volume: 267,
    ),
  ];

  /// Genera una serie realista de precios que camina desde `start` hasta `end`.
  static List<double> _series(double start, double end, {required int seed}) {
    const points = 20;
    final rand = _LCG(seed);
    final result = <double>[];
    for (var i = 0; i < points; i++) {
      final t = i / (points - 1);
      final base = start + (end - start) * t;
      final noise = (rand.next() - 0.5) * (start * 0.06);
      result.add((base + noise).clamp(start * 0.85, end * 1.15));
    }
    return result;
  }
}

/// Ruido determinístico simple — sin importar dart:math por prolijidad.
class _LCG {
  int _state;
  _LCG(int seed) : _state = seed * 1103515245 + 12345;
  double next() {
    _state = (_state * 1103515245 + 12345) & 0x7FFFFFFF;
    return _state / 0x7FFFFFFF;
  }
}
