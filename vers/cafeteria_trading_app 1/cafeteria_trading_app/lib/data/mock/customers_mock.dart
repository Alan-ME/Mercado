import '../../models/customer.dart';

class CustomersMock {
  static final List<Customer> all = [
    Customer(id: 'c1', name: 'Franco Sarrautte', email: 'franco@demo.com', totalOrders: 47, totalSpent: 214.30, tier: 'Oro', joinedAt: DateTime(2025, 3, 14), active: true),
    Customer(id: 'c2', name: 'Sofía Álvarez', email: 'sofi.a@demo.com', totalOrders: 128, totalSpent: 612.80, tier: 'VIP', joinedAt: DateTime(2024, 11, 2), active: true),
    Customer(id: 'c3', name: 'Nicolás Ramírez', email: 'nico.r@demo.com', totalOrders: 22, totalSpent: 89.50, tier: 'Plata', joinedAt: DateTime(2026, 1, 20), active: true),
    Customer(id: 'c4', name: 'Micaela López', email: 'mica.l@demo.com', totalOrders: 8, totalSpent: 31.20, tier: 'Bronce', joinedAt: DateTime(2026, 5, 6), active: true),
    Customer(id: 'c5', name: 'Julián Molina', email: 'julian.m@demo.com', totalOrders: 74, totalSpent: 341.10, tier: 'Oro', joinedAt: DateTime(2025, 8, 11), active: false),
    Customer(id: 'c6', name: 'Camila Ferrer', email: 'camif@demo.com', totalOrders: 96, totalSpent: 489.75, tier: 'VIP', joinedAt: DateTime(2025, 2, 3), active: true),
    Customer(id: 'c7', name: 'Tomás Ibáñez', email: 'tomi.i@demo.com', totalOrders: 4, totalSpent: 18.40, tier: 'Bronce', joinedAt: DateTime(2026, 6, 28), active: true),
    Customer(id: 'c8', name: 'Valentina Ríos', email: 'valen.r@demo.com', totalOrders: 55, totalSpent: 267.90, tier: 'Oro', joinedAt: DateTime(2025, 6, 19), active: true),
  ];
}
