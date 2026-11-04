import 'package:flutter/material.dart';

/// Modelo genérico "producto tradeable". Se llama Product para que sirva
/// tanto para cafés como para cualquier activo (cripto, acciones, etc.).
class Product {
  final String id;
  final String name;
  final String symbol; // ticker corto tipo bolsa: "ESP", "LAT", "MOK"
  final String category;
  final String description;
  final double price;
  final double changePercent24h;
  final double changePercentWeek;
  final List<double> priceHistory; // últimos N puntos para el sparkline
  final IconData icon;
  final Color accent;
  final int volume; // "cantidad negociada" hoy — sirve para volumen o stock
  final String? imagePath;
  final String? badge;

  const Product({
    required this.id,
    required this.name,
    required this.symbol,
    required this.category,
    required this.description,
    required this.price,
    required this.changePercent24h,
    required this.changePercentWeek,
    required this.priceHistory,
    required this.icon,
    required this.accent,
    required this.volume,
    this.imagePath,
    this.badge,
  });

  bool get isUp => changePercent24h >= 0;

  Product copyWith({
    String? name,
    String? symbol,
    String? category,
    String? description,
    double? price,
    double? changePercent24h,
    double? changePercentWeek,
    List<double>? priceHistory,
    IconData? icon,
    Color? accent,
    int? volume,
    String? imagePath,
    String? badge,
  }) {
    return Product(
      id: id,
      name: name ?? this.name,
      symbol: symbol ?? this.symbol,
      category: category ?? this.category,
      description: description ?? this.description,
      price: price ?? this.price,
      changePercent24h: changePercent24h ?? this.changePercent24h,
      changePercentWeek: changePercentWeek ?? this.changePercentWeek,
      priceHistory: priceHistory ?? this.priceHistory,
      icon: icon ?? this.icon,
      accent: accent ?? this.accent,
      volume: volume ?? this.volume,
      imagePath: imagePath ?? this.imagePath,
      badge: badge ?? this.badge,
    );
  }
}
