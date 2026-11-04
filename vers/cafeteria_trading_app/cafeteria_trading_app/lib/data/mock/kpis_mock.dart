import 'package:flutter/material.dart';
import '../../models/kpi.dart';
import '../../theme/app_theme.dart';

class KpisMock {
  static final List<Kpi> dashboard = [
    const Kpi(label: 'Ganancia total', value: '\$18.420', delta: 12.4, icon: Icons.attach_money, accent: AppColors.accentPrimary),
    const Kpi(label: 'Clientes ganados', value: '+184', delta: 8.6, icon: Icons.person_add_alt_1_outlined, accent: AppColors.info),
    const Kpi(label: 'Clientes perdidos', value: '-23', delta: -4.1, icon: Icons.person_remove_alt_1_outlined, accent: AppColors.danger),
    const Kpi(label: 'Ticket promedio', value: '\$4.30', delta: 2.1, icon: Icons.receipt_long_outlined, accent: AppColors.warning),
  ];

  /// Ingresos por día de la última semana
  static final List<double> weeklyRevenue = [820, 1140, 980, 1520, 1710, 2340, 1980];

  static const List<String> weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /// Composición por categoría — se dibuja como donut chart
  static const Map<String, double> categoryShare = {
    'Espresso': 32,
    'Con leche': 41,
    'Frío': 17,
    'Postres': 10,
  };
}
