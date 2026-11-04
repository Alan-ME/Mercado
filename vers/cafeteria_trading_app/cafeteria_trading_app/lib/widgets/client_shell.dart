import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../screens/client/home_screen.dart';
import '../screens/client/orders_screen.dart';
import '../screens/client/login_screen.dart';
import '../screens/client/settings_screen.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import 'cart_drawer.dart';

/// Contenedor de la parte pública. Header estilo trading + navegación por pestañas.
class ClientShell extends StatefulWidget {
  const ClientShell({super.key});

  @override
  State<ClientShell> createState() => _ClientShellState();
}

class _ClientShellState extends State<ClientShell> {
  int _index = 0;

  static const _tabs = <_TabDef>[
    _TabDef('Inicio', Icons.local_cafe_outlined),
    _TabDef('Carta', Icons.storefront_outlined),
    _TabDef('Login', Icons.login_outlined),
    _TabDef('Ajustes', Icons.tune_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;
    return Scaffold(
      endDrawer: const CartDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, wide),
            const Divider(height: 1),
            Expanded(child: _pageForIndex(_index)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'admin_shortcut',
        onPressed: () => Navigator.pushNamed(context, '/admin'),
        icon: const Icon(Icons.admin_panel_settings_outlined),
        label: const Text('Admin'),
        backgroundColor: AppColors.accentSecondary,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _pageForIndex(int i) {
    switch (i) {
      case 0:
        return HomeScreen(onGoToOrders: () => setState(() => _index = 1));
      case 1:
        return const OrdersScreen();
      case 2:
        return const LoginScreen();
      case 3:
        return const SettingsScreen();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildHeader(BuildContext context, bool wide) {
    final app = context.watch<AppState>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Row(
        children: [
          _Logo(),
          const SizedBox(width: 32),
          if (wide)
            Expanded(
              child: Row(
                children: [
                  for (var i = 0; i < _tabs.length; i++) ...[
                    _NavTab(
                      label: _tabs[i].label,
                      icon: _tabs[i].icon,
                      active: _index == i,
                      onTap: () => setState(() => _index = i),
                    ),
                    const SizedBox(width: 6),
                  ],
                ],
              ),
            )
          else
            const Spacer(),
          const _MarketPulse(),
          const SizedBox(width: 12),
          IconButton(
            tooltip: 'Cambiar tema',
            icon: Icon(app.themeMode == ThemeMode.dark
                ? Icons.light_mode_outlined
                : Icons.dark_mode_outlined),
            onPressed: app.toggleTheme,
          ),
          Builder(
            builder: (ctx) => Stack(
              children: [
                IconButton(
                  tooltip: 'Carrito',
                  icon: const Icon(Icons.shopping_bag_outlined),
                  onPressed: () => Scaffold.of(ctx).openEndDrawer(),
                ),
                if (app.cartCount > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${app.cartCount}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (!wide)
            PopupMenuButton<int>(
              icon: const Icon(Icons.menu),
              onSelected: (v) => setState(() => _index = v),
              itemBuilder: (_) => [
                for (var i = 0; i < _tabs.length; i++)
                  PopupMenuItem(
                    value: i,
                    child: Row(
                      children: [
                        Icon(_tabs[i].icon, size: 18),
                        const SizedBox(width: 10),
                        Text(_tabs[i].label),
                      ],
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _NavTab extends StatefulWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  const _NavTab(
      {required this.label,
      required this.icon,
      required this.active,
      required this.onTap});

  @override
  State<_NavTab> createState() => _NavTabState();
}

class _NavTabState extends State<_NavTab> {
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
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: active
                ? AppColors.accentPrimary.withValues(alpha: 0.15)
                : (_hover ? Theme.of(context).cardColor : Colors.transparent),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active
                  ? AppColors.accentPrimary.withValues(alpha: 0.4)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              Icon(widget.icon,
                  size: 16, color: active ? AppColors.accentPrimary : null),
              const SizedBox(width: 6),
              Text(
                widget.label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: active ? AppColors.accentPrimary : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.accentPrimary, AppColors.accentSecondary],
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.coffee_rounded,
              color: Colors.black, size: 20),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BREW/DESK',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                color: Theme.of(context).textTheme.titleLarge?.color,
              ),
            ),
            Text(
              'specialty coffee',
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ],
        ),
      ],
    );
  }
}

/// Pequeño "tape" con precios simulando un ticker de bolsa.
class _MarketPulse extends StatefulWidget {
  const _MarketPulse();
  @override
  State<_MarketPulse> createState() => _MarketPulseState();
}

class _MarketPulseState extends State<_MarketPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).size.width < 720) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: _pulse,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('Barra abierta',
              style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}

class _TabDef {
  final String label;
  final IconData icon;
  const _TabDef(this.label, this.icon);
}
