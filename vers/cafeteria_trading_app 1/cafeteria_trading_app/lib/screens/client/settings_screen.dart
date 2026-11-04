import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_text_styles.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  int _selectedTab = 0;
  String _searchQuery = '';

  static const _sections = <_SettingsSectionDef>[
    _SettingsSectionDef(
      id: 0,
      title: 'Cuenta',
      subtitle: 'Información de tu cuenta, perfil y datos personales',
      icon: Icons.person_outline,
    ),
    _SettingsSectionDef(
      id: 1,
      title: 'Seguridad y acceso',
      subtitle: 'Administra la seguridad de tu sesión, contraseñas y 2FA',
      icon: Icons.lock_outline,
    ),
    _SettingsSectionDef(
      id: 2,
      title: 'Privacidad y seguridad',
      subtitle: 'Controla tu visibilidad, historial y preferencias de datos',
      icon: Icons.shield_outlined,
    ),
    _SettingsSectionDef(
      id: 3,
      title: 'Apariencia o idiomas',
      subtitle: 'Tema visual claro/oscuro e idioma de la interfaz',
      icon: Icons.palette_outlined,
    ),
    _SettingsSectionDef(
      id: 4,
      title: 'Notificaciones',
      subtitle: 'Configura las alertas de variaciones de precio y pedidos',
      icon: Icons.notifications_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final wide = MediaQuery.of(context).size.width >= 820;

    final filteredSections = _sections.where((s) {
      if (_searchQuery.isEmpty) return true;
      return s.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.subtitle.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        if (!wide) {
          // Vista compacta para pantallas pequeñas
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildSearchBar(),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _sections.map((s) {
                    final isSel = s.id == _selectedTab;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        selected: isSel,
                        label: Text(s.title),
                        onSelected: (_) => setState(() => _selectedTab = s.id),
                        selectedColor: const Color(0xFFFFB703).withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                          color: isSel ? const Color(0xFFFFB703) : null,
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),
              _buildRightPanel(app, _selectedTab),
            ],
          );
        }

        // Vista de 2 columnas estilo Twitter (referencia imagen 4)
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Columna izquierda: Categorías de ajustes
              SizedBox(
                width: 310,
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Ajustes',
                              style: AppStyles.heroSubtitle(
                                color: Theme.of(context).textTheme.headlineMedium?.color ?? Colors.white,
                              ).copyWith(fontSize: 22),
                            ),
                            const SizedBox(height: 12),
                            _buildSearchBar(),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      for (final s in filteredSections)
                        _buildCategoryTile(s, _selectedTab == s.id),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 24),

              // Columna derecha: Panel B con las opciones de la categoría seleccionada
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: _buildRightPanel(app, _selectedTab),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      onChanged: (v) => setState(() => _searchQuery = v),
      decoration: InputDecoration(
        hintText: 'Buscar ajustes',
        prefixIcon: const Icon(Icons.search, size: 18),
        isDense: true,
        filled: true,
        fillColor: Theme.of(context).scaffoldBackgroundColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
    );
  }

  Widget _buildCategoryTile(_SettingsSectionDef section, bool isSelected) {
    return InkWell(
      onTap: () => setState(() => _selectedTab = section.id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFFFB703).withValues(alpha: 0.12)
              : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: isSelected ? const Color(0xFFFFB703) : Colors.transparent,
              width: 3.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              section.icon,
              size: 20,
              color: isSelected
                  ? const Color(0xFFFFB703)
                  : Theme.of(context).textTheme.bodyMedium?.color,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                section.title,
                style: TextStyle(
                  fontFamily: AppStyles.fontNirmala,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected
                      ? const Color(0xFFFFB703)
                      : Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 18,
              color: isSelected
                  ? const Color(0xFFFFB703)
                  : Theme.of(context).dividerColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRightPanel(AppState app, int tabId) {
    switch (tabId) {
      case 0:
        return _buildAccountPanel(app);
      case 1:
        return _buildSecurityPanel(app);
      case 2:
        return _buildPrivacyPanel(app);
      case 3:
        return _buildAppearancePanel(app);
      case 4:
        return _buildNotificationsPanel(app);
      default:
        return _buildAccountPanel(app);
    }
  }

  // --- Paneles de opciones según categoría ---

  Widget _buildAccountPanel(AppState app) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelHeader(
          title: 'Cuenta',
          description: 'Consulta los datos de tu cuenta y administra tu perfil.',
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.person_outline,
          title: 'Perfil de usuario',
          subtitle: app.isLoggedIn ? (app.userEmail ?? '') : 'Sin sesión iniciada',
          trailing: ElevatedButton(
            onPressed: () {
              if (app.isLoggedIn) {
                app.logout();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sesión cerrada')),
                );
              } else {
                app.loginMock('cliente@cafetrading.com');
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sesión iniciada (mock)')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: app.isLoggedIn ? AppColors.danger : AppColors.accentPrimary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            child: Text(app.isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'),
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.email_outlined,
          title: 'Correo electrónico',
          subtitle: app.userEmail ?? 'No configurado',
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showMsg('Edición de correo disponible en el backend'),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.delete_forever_outlined,
          title: 'Eliminar cuenta',
          subtitle: 'Desactiva tu cuenta de forma permanente e irreversible',
          titleColor: AppColors.danger,
          trailing: const Icon(Icons.chevron_right, color: AppColors.danger),
          onTap: () => _showMsg('Acción irreversible — confirmación requerida'),
        ),
      ],
    );
  }

  Widget _buildSecurityPanel(AppState app) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelHeader(
          title: 'Seguridad y acceso',
          description: 'Configuraciones de protección de credenciales y doble factor.',
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.password_outlined,
          title: 'Cambiar contraseña',
          subtitle: 'Actualiza periódicamente tu clave de acceso',
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showMsg('Modal de cambio de contraseña simulado'),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.phonelink_lock_outlined,
          title: 'Autenticación en dos pasos (2FA)',
          subtitle: 'Verificación adicional mediante app autenticadora o SMS',
          trailing: Switch(
            value: true,
            activeThumbColor: AppColors.accentPrimary,
            onChanged: (v) => _showMsg('2FA ${v ? "activado" : "desactivado"}'),
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.devices_outlined,
          title: 'Sesiones activas',
          subtitle: 'Windows · Google Chrome (Esta sesión actual)',
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showMsg('Dispositivo actual verificado'),
        ),
      ],
    );
  }

  Widget _buildPrivacyPanel(AppState app) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelHeader(
          title: 'Privacidad y seguridad',
          description: 'Administra tus preferencias de privacidad y registro de datos.',
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.history_outlined,
          title: 'Historial de órdenes y favoritos',
          subtitle: 'Permitir que la barra recuerde tus cafés preferidos',
          trailing: Switch(
            value: true,
            activeThumbColor: AppColors.accentPrimary,
            onChanged: (v) => _showMsg('Historial actualizado'),
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.analytics_outlined,
          title: 'Telemetría de rendimiento',
          subtitle: 'Ayuda a optimizar los tiempos de respuesta de la plataforma',
          trailing: Switch(
            value: false,
            activeThumbColor: AppColors.accentPrimary,
            onChanged: (v) => _showMsg('Preferencia guardada'),
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.cookie_outlined,
          title: 'Cookies y almacenamiento local',
          subtitle: 'Gestionar datos en caché del navegador',
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showMsg('Caché sincronizada correctamente'),
        ),
      ],
    );
  }

  Widget _buildAppearancePanel(AppState app) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelHeader(
          title: 'Apariencia o idiomas',
          description: 'Personaliza el tema visual de la plataforma y el idioma del texto.',
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.palette_outlined,
          title: 'Tema de la interfaz',
          subtitle: app.themeMode == ThemeMode.dark ? 'Modo Oscuro activo' : 'Modo Claro activo',
          trailing: SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(
                value: ThemeMode.dark,
                icon: Icon(Icons.dark_mode_outlined, size: 16),
                label: Text('Oscuro'),
              ),
              ButtonSegment(
                value: ThemeMode.light,
                icon: Icon(Icons.light_mode_outlined, size: 16),
                label: Text('Claro'),
              ),
            ],
            selected: {
              app.themeMode == ThemeMode.dark ? ThemeMode.dark : ThemeMode.light
            },
            onSelectionChanged: (s) => app.setTheme(s.first),
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.language_outlined,
          title: 'Idioma del sistema',
          subtitle: app.language == 'es' ? 'Español' : 'English',
          trailing: DropdownButton<String>(
            value: app.language,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'es', child: Text('Español (ES)')),
              DropdownMenuItem(value: 'en', child: Text('English (EN)')),
            ],
            onChanged: (v) => v == null ? null : app.setLanguage(v),
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationsPanel(AppState app) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelHeader(
          title: 'Notificaciones',
          description: 'Alertas en tiempo real sobre bajas de precio y nuevos tostados.',
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.notifications_active_outlined,
          title: 'Notificaciones push en vivo',
          subtitle: 'Avisar cuando cambia la cotización de mis cafés favoritos',
          trailing: Switch(
            value: app.notifications,
            onChanged: app.setNotifications,
            activeThumbColor: AppColors.accentPrimary,
          ),
        ),
        const Divider(height: 28),
        _SettingsTile(
          icon: Icons.mark_email_read_outlined,
          title: 'Alertas por correo electrónico',
          subtitle: 'Resumen semanal de consumo y balance de cuenta',
          trailing: Switch(
            value: app.emailAlerts,
            onChanged: app.setEmailAlerts,
            activeThumbColor: AppColors.accentPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildPanelHeader({required String title, required String description}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppStyles.heroSubtitle(
            color: Theme.of(context).textTheme.headlineMedium?.color ?? Colors.white,
          ).copyWith(fontSize: 20),
        ),
        const SizedBox(height: 4),
        Text(
          description,
          style: AppStyles.heroBody(
            color: Theme.of(context).textTheme.bodyMedium?.color ?? const Color(0xFF8B92A5),
          ).copyWith(fontSize: 13, shadows: AppStyles.textShadows(stroke: 0.4)),
        ),
      ],
    );
  }

  void _showMsg(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), duration: const Duration(seconds: 2)),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget trailing;
  final Color? titleColor;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.trailing,
    this.titleColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Icon(icon, size: 20, color: titleColor ?? AppColors.accentPrimary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: AppStyles.fontNirmala,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: titleColor ?? Theme.of(context).textTheme.titleMedium?.color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            trailing,
          ],
        ),
      ),
    );
  }
}

class _SettingsSectionDef {
  final int id;
  final String title;
  final String subtitle;
  final IconData icon;

  const _SettingsSectionDef({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
  });
}
