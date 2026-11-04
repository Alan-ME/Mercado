import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/mock/customers_mock.dart';
import '../../models/customer.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';

class CustomersAdminScreen extends StatefulWidget {
  const CustomersAdminScreen({super.key});
  @override
  State<CustomersAdminScreen> createState() => _CustomersAdminScreenState();
}

class _CustomersAdminScreenState extends State<CustomersAdminScreen> {
  String _query = '';
  String _tier = 'Todos';

  @override
  Widget build(BuildContext context) {
    final tiers = ['Todos', 'VIP', 'Oro', 'Plata', 'Bronce'];
    var list = CustomersMock.all.where((c) {
      final matchTier = _tier == 'Todos' || c.tier == _tier;
      final matchQ = _query.isEmpty ||
          c.name.toLowerCase().contains(_query.toLowerCase()) ||
          c.email.toLowerCase().contains(_query.toLowerCase());
      return matchTier && matchQ;
    }).toList();

    final totalOrders = list.fold<int>(0, (a, b) => a + b.totalOrders);
    final totalSpent = list.fold<double>(0, (a, b) => a + b.totalSpent);
    final active = list.where((c) => c.active).length;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Clientes', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('Base de clientes y métricas asociadas.',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                  child: _StatBox(
                      label: 'Total clientes',
                      value: '${list.length}',
                      color: AppColors.info)),
              const SizedBox(width: 12),
              Expanded(
                  child: _StatBox(
                      label: 'Activos',
                      value: '$active',
                      color: AppColors.success)),
              const SizedBox(width: 12),
              Expanded(
                  child: _StatBox(
                      label: 'Órdenes acumuladas',
                      value: '$totalOrders',
                      color: AppColors.warning)),
              const SizedBox(width: 12),
              Expanded(
                  child: _StatBox(
                      label: 'Gastado total',
                      value: Fmt.money(totalSpent),
                      color: AppColors.accentPrimary)),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 280,
                  child: TextField(
                    onChanged: (v) => setState(() => _query = v),
                    decoration: const InputDecoration(
                      hintText: 'Buscar cliente…',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Wrap(
                  spacing: 6,
                  children: tiers.map((t) {
                    final active = _tier == t;
                    return ChoiceChip(
                      label: Text(t),
                      selected: active,
                      onSelected: (_) => setState(() => _tier = t),
                      selectedColor:
                          AppColors.accentPrimary.withValues(alpha: 0.2),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: ListView.separated(
                itemCount: list.length,
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.5),
                ),
                itemBuilder: (_, i) => _customerRow(context, list[i]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _customerRow(BuildContext context, Customer c) {
    final tierColor = switch (c.tier) {
      'VIP' => AppColors.accentSecondary,
      'Oro' => AppColors.warning,
      'Plata' => AppColors.info,
      _ => AppColors.textSecondaryDark,
    };
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: tierColor.withValues(alpha: 0.2),
            child: Text(
              c.name.split(' ').map((s) => s[0]).take(2).join(),
              style: TextStyle(color: tierColor, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(c.name, style: Theme.of(context).textTheme.titleMedium),
                Text(c.email, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: tierColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: tierColor.withValues(alpha: 0.3)),
              ),
              child: Text(
                c.tier,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: tierColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 12),
              ),
            ),
          ),
          Expanded(
            child: Text('${c.totalOrders} órdenes',
                style: Theme.of(context).textTheme.bodyMedium),
          ),
          Expanded(
            child: Text(Fmt.money(c.totalSpent),
                style: Theme.of(context).textTheme.titleMedium),
          ),
          Expanded(
            child: Text(DateFormat.yMMMd().format(c.joinedAt),
                style: Theme.of(context).textTheme.bodyMedium),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: c.active
                  ? AppColors.success.withValues(alpha: 0.15)
                  : AppColors.danger.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              c.active ? 'Activo' : 'Inactivo',
              style: TextStyle(
                color: c.active ? AppColors.success : AppColors.danger,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_horiz),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Acción simulada — pendiente backend')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatBox(
      {required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 6),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: color)),
        ],
      ),
    );
  }
}
