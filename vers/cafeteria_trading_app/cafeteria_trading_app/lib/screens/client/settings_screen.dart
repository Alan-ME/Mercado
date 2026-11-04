import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Ajustes', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 4),
        Text(
            'Preferencias del usuario. Persistidas en memoria mientras la app está abierta.',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),
        _Section(
          title: 'Apariencia',
          children: [
            _SettingsTile(
              icon: Icons.palette_outlined,
              title: 'Tema',
              subtitle: app.themeMode == ThemeMode.dark ? 'Oscuro' : 'Claro',
              trailing: SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment(
                      value: ThemeMode.dark,
                      icon: Icon(Icons.dark_mode_outlined),
                      label: Text('Oscuro')),
                  ButtonSegment(
                      value: ThemeMode.light,
                      icon: Icon(Icons.light_mode_outlined),
                      label: Text('Claro')),
                ],
                selected: {
                  app.themeMode == ThemeMode.dark
                      ? ThemeMode.dark
                      : ThemeMode.light
                },
                onSelectionChanged: (s) => app.setTheme(s.first),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _Section(
          title: 'Idioma',
          children: [
            _SettingsTile(
              icon: Icons.language,
              title: 'Idioma de la interfaz',
              subtitle: app.language == 'es' ? 'Español' : 'English',
              trailing: DropdownButton<String>(
                value: app.language,
                underline: const SizedBox.shrink(),
                items: const [
                  DropdownMenuItem(value: 'es', child: Text('Español')),
                  DropdownMenuItem(value: 'en', child: Text('English')),
                ],
                onChanged: (v) => v == null ? null : app.setLanguage(v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _Section(
          title: 'Notificaciones',
          children: [
            _SettingsTile(
              icon: Icons.notifications_outlined,
              title: 'Notificaciones push',
              subtitle: 'Te avisamos cuando cambia el precio de tus favoritos',
              trailing: Switch(
                value: app.notifications,
                onChanged: app.setNotifications,
                activeThumbColor: AppColors.accentPrimary,
              ),
            ),
            _SettingsTile(
              icon: Icons.email_outlined,
              title: 'Alertas por email',
              subtitle: 'Resumen semanal de tu barra y consumo',
              trailing: Switch(
                value: app.emailAlerts,
                onChanged: app.setEmailAlerts,
                activeThumbColor: AppColors.accentPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _Section(
          title: 'Cuenta',
          children: [
            _SettingsTile(
              icon: Icons.person_outline,
              title: 'Perfil',
              subtitle: app.isLoggedIn ? (app.userEmail ?? '') : 'Sin sesión',
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Acción simulada — pendiente backend')),
                );
              },
            ),
            _SettingsTile(
              icon: Icons.security_outlined,
              title: 'Seguridad',
              subtitle: 'Cambiar contraseña, 2FA',
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Acción simulada — pendiente backend')),
                );
              },
            ),
            _SettingsTile(
              icon: Icons.delete_forever_outlined,
              title: 'Eliminar cuenta',
              subtitle: 'Acción irreversible',
              titleColor: AppColors.danger,
              trailing:
                  const Icon(Icons.chevron_right, color: AppColors.danger),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Acción simulada — pendiente backend')),
                );
              },
            ),
          ],
        ),
        const SizedBox(height: 24),
        Center(
          child: Text('BREW/DESK · v0.1.0 · frontend demo',
              style: Theme.of(context).textTheme.labelSmall),
        ),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section({required this.title, required this.children});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
            child: Text(title.toUpperCase(),
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(letterSpacing: 1.4)),
          ),
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1)
              Divider(
                  height: 1,
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.6)),
          ],
        ],
      ),
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Icon(icon, size: 18, color: titleColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(color: titleColor)),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
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
