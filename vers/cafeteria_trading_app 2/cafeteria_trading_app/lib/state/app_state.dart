import 'package:flutter/material.dart';
import '../models/product.dart';
import '../data/mock/products_mock.dart';

/// Estado global de la app. Persistido solo en memoria (no localStorage real).
/// Cuando llegue el backend, este ChangeNotifier se transforma en cliente API.
class AppState extends ChangeNotifier {
  // ---- Tema ----
  ThemeMode _themeMode = ThemeMode.dark;
  ThemeMode get themeMode => _themeMode;
  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }
  void setTheme(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  // ---- Preferencias del usuario ----
  String _language = 'es';
  String get language => _language;
  void setLanguage(String v) { _language = v; notifyListeners(); }

  bool _notifications = true;
  bool get notifications => _notifications;
  void setNotifications(bool v) { _notifications = v; notifyListeners(); }

  bool _emailAlerts = false;
  bool get emailAlerts => _emailAlerts;
  void setEmailAlerts(bool v) { _emailAlerts = v; notifyListeners(); }

  // ---- Sesión (mock) ----
  String? _userEmail;
  String? get userEmail => _userEmail;
  bool get isLoggedIn => _userEmail != null;
  void loginMock(String email) { _userEmail = email; notifyListeners(); }
  void logout() { _userEmail = null; notifyListeners(); }

  // ---- Productos ----
  final List<Product> _products = List.of(ProductsMock.all);
  List<Product> get products => List.unmodifiable(_products);

  void addProduct(Product p) {
    _products.add(p);
    notifyListeners();
  }
  void updateProduct(Product p) {
    final i = _products.indexWhere((e) => e.id == p.id);
    if (i != -1) {
      _products[i] = p;
      notifyListeners();
    }
  }
  void removeProduct(String id) {
    _products.removeWhere((e) => e.id == id);
    notifyListeners();
  }

  // ---- Carrito ----
  final Map<String, int> _cart = {}; // productId -> qty
  Map<String, int> get cart => Map.unmodifiable(_cart);
  int get cartCount => _cart.values.fold(0, (a, b) => a + b);
  double get cartTotal {
    var t = 0.0;
    _cart.forEach((id, qty) {
      final p = _products.firstWhere((e) => e.id == id, orElse: () => _products.first);
      t += p.price * qty;
    });
    return t;
  }
  void addToCart(String productId) {
    _cart[productId] = (_cart[productId] ?? 0) + 1;
    notifyListeners();
  }
  void decreaseFromCart(String productId) {
    final q = _cart[productId] ?? 0;
    if (q <= 1) {
      _cart.remove(productId);
    } else {
      _cart[productId] = q - 1;
    }
    notifyListeners();
  }
  void removeFromCart(String productId) {
    _cart.remove(productId);
    notifyListeners();
  }
  void clearCart() {
    _cart.clear();
    notifyListeners();
  }
}
