import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../screens/client/home_screen.dart';
import '../screens/client/orders_screen.dart';
import '../screens/client/login_screen.dart';
import '../screens/client/settings_screen.dart';
import '../state/app_state.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_theme.dart';
import 'cart_drawer.dart';

/// Contenedor de la parte pública. Header idéntico a las imágenes 3 y 4.
class ClientShell extends StatefulWidget {
  const ClientShell({super.key});

  @override
  State<ClientShell> createState() => _ClientShellState();
}

class _ClientShellState extends State<ClientShell> {
  int _index = 0;

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
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Row(
        children: [
          // Logo "BREW/DESK specialty coffee"
          GestureDetector(
            onTap: () => setState(() => _index = 0),
            child: _Logo(),
          ),
          const SizedBox(width: 28),

          // Pestañas principales (INICIO, CARTA, BARRA ABIERTA · HOY)
          if (wide) ...[
            _MainHeaderTab(
              label: 'INICIO',
              active: _index == 0,
              onTap: () => setState(() => _index = 0),
            ),
            const SizedBox(width: 10),
            _MainHeaderTab(
              label: 'CARTA',
              active: _index == 1,
              onTap: () => setState(() => _index = 1),
            ),
            const SizedBox(width: 16),
            const _MarketPulse(),
          ],

          const Spacer(),

          // Botón "INICIAR SESIÓN" (o nombre de usuario si ya inició)
          ElevatedButton(
            onPressed: () => setState(() => _index = 2),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00D9A3),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              elevation: 0,
              textStyle: const TextStyle(
                fontFamily: AppStyles.fontLemonMilk,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            child: Text(app.isLoggedIn ? (app.userEmail?.split('@').first.toUpperCase() ?? 'SESIÓN') : 'INICIAR SESION'),
          ),
          const SizedBox(width: 10),

          // Botón de Ajustes (icono de engranaje como en imagen 3 y 4)
          Container(
            decoration: BoxDecoration(
              color: _index == 3
                  ? const Color(0xFFFFB703).withValues(alpha: 0.2)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: IconButton(
              tooltip: 'Ajustes',
              icon: Icon(
                Icons.settings_outlined,
                size: 20,
                color: _index == 3 ? const Color(0xFFFFB703) : null,
              ),
              onPressed: () => setState(() => _index = 3),
            ),
          ),
          const SizedBox(width: 4),

          // Cambio de tema
          IconButton(
            tooltip: 'Cambiar tema',
            icon: Icon(
              app.themeMode == ThemeMode.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
              size: 20,
            ),
            onPressed: app.toggleTheme,
          ),
          const SizedBox(width: 4),

          // Carrito de compras
          Builder(
            builder: (ctx) => Stack(
              children: [
                IconButton(
                  tooltip: 'Carrito de compras',
                  icon: const Icon(Icons.shopping_bag_outlined, size: 20),
                  onPressed: () => Scaffold.of(ctx).openEndDrawer(),
                ),
                if (app.cartCount > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${app.cartCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Menú responsive si pantalla estrecha
          if (!wide)
            PopupMenuButton<int>(
              icon: const Icon(Icons.menu),
              onSelected: (v) => setState(() => _index = v),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 0, child: Text('INICIO')),
                PopupMenuItem(value: 1, child: Text('CARTA')),
                PopupMenuItem(value: 2, child: Text('LOGIN')),
                PopupMenuItem(value: 3, child: Text('AJUSTES')),
              ],
            ),
        ],
      ),
    );
  }
}

class _MainHeaderTab extends StatefulWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _MainHeaderTab({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  State<_MainHeaderTab> createState() => _MainHeaderTabState();
}

class _MainHeaderTabState extends State<_MainHeaderTab> {
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
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: BoxDecoration(
            color: active
                ? const Color(0xFFFFB703) // Amarillo dorado en activo como imagen 3 y 4
                : (_hover ? Theme.of(context).cardColor : Colors.transparent),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: active
                  ? const Color(0xFFFFB703)
                  : (_hover ? Theme.of(context).dividerColor : Colors.transparent),
            ),
          ),
          child: Text(
            widget.label,
            style: TextStyle(
              fontFamily: AppStyles.fontLemonMilk,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              color: active ? Colors.black : Colors.white,
            ),
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
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: const Color(0xFFFFB703),
            borderRadius: BorderRadius.circular(7),
          ),
          child: const Icon(Icons.coffee_rounded, color: Colors.black, size: 18),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BREW/DESK',
              style: TextStyle(
                fontFamily: AppStyles.fontLemonMilk,
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                color: Theme.of(context).textTheme.titleLarge?.color ?? Colors.white,
              ),
            ),
            Text(
              'specialty coffee',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 9),
            ),
          ],
        ),
      ],
    );
  }
}

/// Badge "BARRA ABIERTA · HOY" en amarillo con punto verde pulsante
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
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFFFB703).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFB703).withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: _pulse,
            child: Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 7),
          const Text(
            'BARRA ABIERTA · HOY',
            style: TextStyle(
              fontFamily: AppStyles.fontLemonMilk,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
              color: Color(0xFFFFB703),
            ),
          ),
        ],
      ),
    );
  }
}
