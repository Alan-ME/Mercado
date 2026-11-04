# BREW/DESK — Cafetería estilo trading

Frontend en Flutter para una cafetería, con estética de plataforma de trading
(precios en vivo, variaciones diarias/semanales, gráficos, dashboard admin).
La estructura visual es **temáticamente neutra**: cambiando la lista de
`Product` en `lib/data/mock/products_mock.dart` la app sirve igual para criptos,
acciones o cualquier otro catálogo.

## Requisitos

- Flutter 3.13+ (canal stable)
- Dart 3.0+
- Chrome (para correr en web) o cualquier target de escritorio/móvil

## Cómo correr

```bash
cd cafeteria_trading_app
flutter pub get
flutter run -d chrome   # web
# o
flutter run -d windows  # escritorio Windows
# o
flutter run             # dispositivo/emulador que tengas configurado
```

## Estructura

```
lib/
├── main.dart                 # entrypoint, rutas '/' y '/admin'
├── theme/
│   └── app_theme.dart        # light + dark, paleta trading
├── models/
│   ├── product.dart          # activo genérico (café / cripto / acción)
│   ├── customer.dart
│   └── kpi.dart
├── data/
│   └── mock/                 # ← reemplazar por API real cuando llegue
│       ├── products_mock.dart
│       ├── customers_mock.dart
│       └── kpis_mock.dart
├── state/
│   └── app_state.dart        # ChangeNotifier: tema, carrito, sesión mock, CRUD productos
├── utils/
│   └── formatters.dart       # $ y % consistentes
├── widgets/
│   ├── client_shell.dart     # header + tabs del sitio público
│   ├── product_card.dart     # card con sparkline + botón "Pedir"
│   ├── mini_chart.dart       # sparkline reusable
│   ├── kpi_card.dart         # tile de dashboard
│   └── cart_drawer.dart      # carrito lateral
└── screens/
    ├── client/
    │   ├── home_screen.dart
    │   ├── orders_screen.dart
    │   ├── product_detail_screen.dart
    │   ├── login_screen.dart
    │   └── settings_screen.dart
    └── admin/
        ├── admin_shell.dart
        ├── dashboard_screen.dart
        ├── products_admin_screen.dart
        └── customers_admin_screen.dart
```

## Pestañas / secciones

### Público (`/`)
- **Inicio** — hero animado, producto en tendencia con gráfico grande,
  resumen de mercado, destacados de la semana.
- **Pedidos** — grilla estilo exchange: precio, variación 24h/7d, sparkline,
  filtros por categoría, búsqueda y orden (variación, precio, volumen).
- **Login** — form mock con validación local, botones sociales simulados.
- **Ajustes** — tema claro/oscuro, idioma, notificaciones (estado en memoria).
- **Detalle** de cada producto (al hacer click) con gráfico 24h/7d/30d y
  panel de métricas.
- **Carrito** lateral animado (icono superior derecho).

### Admin (`/admin`, FAB del sitio o `Navigator.pushNamed`)
- **Dashboard** — 4 KPIs (ganancia, clientes ganados/perdidos, ticket promedio),
  gráfico de ingresos semanales, donut de composición por categoría, top de
  productos por volumen.
- **Productos** — tabla con precios en vivo + sparklines; crear, editar y
  eliminar productos (persistido en estado de la app).
- **Clientes** — cards de métricas + tabla filtrable por tier (Bronce/Plata/Oro/VIP).
- **Órdenes / Reportes / Configuración** — vistas placeholder marcadas como
  "pendiente backend".

## Reglas del proyecto (etapa 1)

- **Solo frontend.** Cualquier botón que "necesitaría backend" muestra un
  `SnackBar` con el mensaje *"Acción simulada — pendiente backend"*.
- **Sin llamadas HTTP.** Los datos viven en `lib/data/mock/*.dart` y se
  consumen a través de `AppState`. Para conectar la API real:
  1. Reemplazar los mocks por un servicio HTTP.
  2. Adaptar `AppState` para que consuma ese servicio.
  3. El resto de la UI no necesita cambios.

## Diseño

- Paleta trading (verde = sube, rojo = baja, acento violeta/mint).
- Tema oscuro por defecto en admin, alternable en cliente.
- Animaciones: hover en cards y tabs, transición de gráficos, ticker "mercado
  abierto" con pulso, transformaciones al pasar el mouse.
- Charts con `fl_chart` (sparklines, línea con área, barras, donut).
