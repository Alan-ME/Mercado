import 'package:flutter/material.dart';

class Kpi {
  final String label;
  final String value;
  final double delta; // % vs período anterior
  final IconData icon;
  final Color accent;

  const Kpi({
    required this.label,
    required this.value,
    required this.delta,
    required this.icon,
    required this.accent,
  });

  bool get isUp => delta >= 0;
}
