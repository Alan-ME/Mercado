import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class CartDrawer extends StatelessWidget {
  const CartDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Drawer(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      width: 380,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 12, 12),
              child: Row(
                children: [
                  const Icon(Icons.shopping_bag_outlined, size: 22),
                  const SizedBox(width: 8),
                  Text('Tu pedido',
                      style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: app.cart.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.shopping_cart_outlined,
                              size: 48, color: Theme.of(context).dividerColor),
                          const SizedBox(height: 12),
                          Text('Tu carrito está vacío',
                              style: Theme.of(context).textTheme.bodyMedium),
                        ],
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: app.cart.entries.map((e) {
                        final p = app.products.firstWhere(
                          (x) => x.id == e.key,
                          orElse: () => app.products.first,
                        );
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: Theme.of(context).dividerColor),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: p.accent.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(p.icon, color: p.accent),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.name,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                    Text(Fmt.money(p.price),
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall),
                                  ],
                                ),
                              ),
                              _QtyControls(productId: p.id, qty: e.value),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
            ),
            if (app.cart.isNotEmpty) ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text('Total',
                            style: Theme.of(context).textTheme.titleLarge),
                        const Spacer(),
                        Text(Fmt.money(app.cartTotal),
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  color: AppColors.accentPrimary,
                                )),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.rocket_launch_outlined),
                        label: const Text('Confirmar pedido'),
                        onPressed: () {
                          Navigator.of(context).pop();
                          app.clearCart();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content:
                                  Text('Acción simulada — pendiente backend'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _QtyControls extends StatelessWidget {
  final String productId;
  final int qty;
  const _QtyControls({required this.productId, required this.qty});

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          IconButton(
            iconSize: 16,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            onPressed: () => app.decreaseFromCart(productId),
            icon: const Icon(Icons.remove),
          ),
          SizedBox(
            width: 22,
            child: Text('$qty',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium),
          ),
          IconButton(
            iconSize: 16,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            onPressed: () => app.addToCart(productId),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
