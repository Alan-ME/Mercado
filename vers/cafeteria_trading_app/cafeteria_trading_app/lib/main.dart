import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:provider/provider.dart';
import 'screens/admin/admin_shell.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';
import 'widgets/client_shell.dart';

void main() {
  // Sin esto la URL sale con # (ej: /#/admin). Con esto queda /admin limpio.
  usePathUrlStrategy();
  runApp(const CafeteriaTradingApp());
}

class CafeteriaTradingApp extends StatelessWidget {
  const CafeteriaTradingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: Consumer<AppState>(
        builder: (context, app, _) => MaterialApp(
          title: 'BREW/DESK',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: app.themeMode,
          initialRoute: '/',
          routes: {
            '/': (_) => const ClientShell(),
            '/admin': (_) => const AdminShell(),
          },
          onUnknownRoute: (_) =>
              MaterialPageRoute(builder: (_) => const ClientShell()),
        ),
      ),
    );
  }
}
