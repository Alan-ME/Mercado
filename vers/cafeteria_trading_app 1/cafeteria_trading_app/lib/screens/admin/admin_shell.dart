import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'products_admin_screen.dart';
import 'customers_admin_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  static const _items = [
    _NavItem('Dashboard', Icons.dashboard_outlined),
    _NavItem('Productos', Icons.local_offer_outlined),
    _NavItem('Clientes', Icons.people_outline),
    _NavItem('Órdenes', Icons.receipt_long_outlined),
    _NavItem('Reportes', Icons.assessment_outlined),
    _NavItem('Configuración', Icons.settings_outlined),
  ];

  Widget _pageForIndex(int i) {
    switch (i) {
      case 0:
        return const DashboardScreen();
      case 1:
        return const ProductsAdminScreen();
      case 2:
        return const CustomersAdminScreen();
      default:
        return const _MockPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 1050;
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            if (wide)
              _Sidebar(
                items: _items,
                activeIndex: _index,
                onTap: (i) => setState(() => _index = i),
              ),
            Expanded(
              child: Column(
                children: [
                  _AdminHeader(
                    title: _items[_index].label,
                    showMenu: !wide,
                    onMenu: () async {
                      final v = await showModalBottomSheet<int>(
                        context: context,
                        backgroundColor: Theme.of(context).cardColor,
                        builder: (_) =>
                            _MobileNav(items: _items, active: _index),
                      );
                      if (v != null) setState(() => _index = v);
                    },
                  ),
                  const Divider(height: 1),
                  Expanded(child: _pageForIndex(_index)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  const _NavItem(this.label, this.icon);
}

class _Sidebar extends StatelessWidget {
  final List<_NavItem> items;
  final int activeIndex;
  final ValueChanged<int> onTap;
  const _Sidebar(
      {required this.items, required this.activeIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border:
            Border(right: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        AppColors.accentPrimary,
                        AppColors.accentSecondary
                      ],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.candlestick_chart,
                      color: Colors.black, size: 20),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('BREW/DESK',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.1,
                                )),
                    Text('admin console',
                        style: Theme.of(context).textTheme.labelSmall),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemCount: items.length,
              itemBuilder: (_, i) => _SideTile(
                item: items[i],
                active: i == activeIndex,
                onTap: () => onTap(i),
              ),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pushReplacementNamed('/'),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Volver al sitio'),
              style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(40)),
            ),
          ),
        ],
      ),
    );
  }
}

class _SideTile extends StatefulWidget {
  final _NavItem item;
  final bool active;
  final VoidCallback onTap;
  const _SideTile(
      {required this.item, required this.active, required this.onTap});
  @override
  State<_SideTile> createState() => _SideTileState();
}

class _SideTileState extends State<_SideTile> {
  bool _hover = false;
  @override
  Widget build(BuildContext context) {
    final active = widget.active;
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.symmetric(vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: active
                ? AppColors.accentPrimary.withValues(alpha: 0.15)
                : (_hover
                    ? Theme.of(context).scaffoldBackgroundColor
                    : Colors.transparent),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(widget.item.icon,
                  size: 18,
                  color: active
                      ? AppColors.accentPrimary
                      : Theme.of(context).textTheme.bodyMedium?.color),
              const SizedBox(width: 12),
              Text(
                widget.item.label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: active
                      ? AppColors.accentPrimary
                      : Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
              const Spacer(),
              if (active)
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    color: AppColors.accentPrimary,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdminHeader extends StatelessWidget {
  final String title;
  final bool showMenu;
  final VoidCallback onMenu;
  const _AdminHeader(
      {required this.title, required this.showMenu, required this.onMenu});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Row(
        children: [
          if (showMenu)
            IconButton(icon: const Icon(Icons.menu), onPressed: onMenu),
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
              border:
                  Border.all(color: AppColors.success.withValues(alpha: 0.4)),
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
                const Text('en vivo',
                    style: TextStyle(
                        color: AppColors.success,
                        fontSize: 11,
                        fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const Spacer(),
          SizedBox(
            width: 260,
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Buscar…',
                prefixIcon: Icon(Icons.search, size: 18),
                isDense: true,
              ),
              onChanged: (_) {},
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'Cambiar tema',
            onPressed: app.toggleTheme,
            icon: Icon(app.themeMode == ThemeMode.dark
                ? Icons.light_mode_outlined
                : Icons.dark_mode_outlined),
          ),
          Stack(
            children: [
              IconButton(
                tooltip: 'Notificaciones',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Acción simulada — pendiente backend')),
                  );
                },
                icon: const Icon(Icons.notifications_outlined),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                      color: AppColors.danger, shape: BoxShape.circle),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(
                  radius: 12,
                  backgroundColor: AppColors.accentSecondary,
                  child: Text('A',
                      style:
                          TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 8),
                Text('Admin',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_drop_down, size: 18),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MobileNav extends StatelessWidget {
  final List<_NavItem> items;
  final int active;
  const _MobileNav({required this.items, required this.active});
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < items.length; i++)
            ListTile(
              leading: Icon(items[i].icon,
                  color: i == active ? AppColors.accentPrimary : null),
              title: Text(items[i].label,
                  style: TextStyle(
                    color: i == active ? AppColors.accentPrimary : null,
                    fontWeight: FontWeight.w600,
                  )),
              onTap: () => Navigator.of(context).pop(i),
            ),
        ],
      ),
    );
  }
}

class _MockPage extends StatelessWidget {
  const _MockPage();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.construction_outlined,
                size: 48, color: Theme.of(context).dividerColor),
            const SizedBox(height: 12),
            Text('Módulo en construcción',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
                'Este panel requiere backend. Estará disponible en la próxima etapa.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
