class Customer {
  final String id;
  final String name;
  final String email;
  final int totalOrders;
  final double totalSpent;
  final String tier; // Bronce, Plata, Oro, VIP
  final DateTime joinedAt;
  final bool active;

  const Customer({
    required this.id,
    required this.name,
    required this.email,
    required this.totalOrders,
    required this.totalSpent,
    required this.tier,
    required this.joinedAt,
    required this.active,
  });
}
