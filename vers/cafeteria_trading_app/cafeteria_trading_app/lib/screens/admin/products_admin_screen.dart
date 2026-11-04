import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/mini_chart.dart';

class ProductsAdminScreen extends StatefulWidget {
  const ProductsAdminScreen({super.key});
  @override
  State<ProductsAdminScreen> createState() => _ProductsAdminScreenState();
}

class _ProductsAdminScreenState extends State<ProductsAdminScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final list = app.products
        .where((p) =>
            _query.isEmpty ||
            p.name.toLowerCase().contains(_query.toLowerCase()) ||
            p.symbol.toLowerCase().contains(_query.toLowerCase()))
        .toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Gestión de productos',
                        style: Theme.of(context).textTheme.headlineMedium),
                    Text('Agregá, editá o retirá productos del mercado.',
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => _openEditor(context, null),
                icon: const Icon(Icons.add),
                label: const Text('Nuevo producto'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 280,
                  child: TextField(
                    onChanged: (v) => setState(() => _query = v),
                    decoration: const InputDecoration(
                      hintText: 'Buscar producto…',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                  ),
                ),
                const Spacer(),
                Text('${list.length} productos',
                    style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                children: [
                  _header(context),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  Expanded(
                    child: list.isEmpty
                        ? Center(
                            child: Text('Sin resultados',
                                style: Theme.of(context).textTheme.bodyMedium),
                          )
                        : ListView.separated(
                            itemCount: list.length,
                            separatorBuilder: (_, __) => Divider(
                              height: 1,
                              color: Theme.of(context)
                                  .dividerColor
                                  .withValues(alpha: 0.5),
                            ),
                            itemBuilder: (_, i) => _row(context, list[i]),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _header(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Expanded(flex: 4, child: _HeaderCell('Producto')),
          Expanded(flex: 2, child: _HeaderCell('Categoría')),
          Expanded(flex: 2, child: _HeaderCell('Precio')),
          Expanded(flex: 2, child: _HeaderCell('24h')),
          Expanded(flex: 2, child: _HeaderCell('Tendencia')),
          Expanded(flex: 2, child: _HeaderCell('Volumen')),
          SizedBox(width: 96),
        ],
      ),
    );
  }

  Widget _row(BuildContext context, Product p) {
    const upColor = AppColors.success;
    const downColor = AppColors.danger;
    final color = p.isUp ? upColor : downColor;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: p.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(p.icon, color: p.accent, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium),
                      Text(p.symbol,
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(letterSpacing: 1)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child:
                Text(p.category, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Expanded(
            flex: 2,
            child: Text(Fmt.money(p.price),
                style: Theme.of(context).textTheme.titleMedium),
          ),
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(p.isUp ? Icons.arrow_upward : Icons.arrow_downward,
                      color: color, size: 12),
                  const SizedBox(width: 2),
                  Text(Fmt.pct(p.changePercent24h),
                      style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: SizedBox(
                height: 32,
                child:
                    MiniChart(data: p.priceHistory, color: color, height: 32)),
          ),
          Expanded(
            flex: 2,
            child: Text('${p.volume}',
                style: Theme.of(context).textTheme.titleMedium),
          ),
          SizedBox(
            width: 96,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  tooltip: 'Editar',
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  onPressed: () => _openEditor(context, p),
                ),
                IconButton(
                  tooltip: 'Eliminar',
                  icon: const Icon(Icons.delete_outline,
                      size: 18, color: AppColors.danger),
                  onPressed: () => _confirmDelete(context, p),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, Product p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar producto'),
        content: Text(
            '¿Retirar "${p.name}" del mercado? Esta acción es reversible mientras la sesión esté abierta.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      context.read<AppState>().removeProduct(p.id);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${p.name} eliminado')),
      );
    }
  }

  void _openEditor(BuildContext context, Product? p) {
    showDialog(
      context: context,
      builder: (_) => _ProductEditor(product: p),
    );
  }
}

class _HeaderCell extends StatelessWidget {
  final String text;
  const _HeaderCell(this.text);
  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(),
        style: Theme.of(context)
            .textTheme
            .labelSmall
            ?.copyWith(letterSpacing: 1.2));
  }
}

class _ProductEditor extends StatefulWidget {
  final Product? product;
  const _ProductEditor({required this.product});
  @override
  State<_ProductEditor> createState() => _ProductEditorState();
}

class _ProductEditorState extends State<_ProductEditor> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _name;
  late TextEditingController _symbol;
  late TextEditingController _category;
  late TextEditingController _price;
  late TextEditingController _description;
  late TextEditingController _volume;

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _name = TextEditingController(text: p?.name ?? '');
    _symbol = TextEditingController(text: p?.symbol ?? '');
    _category = TextEditingController(text: p?.category ?? '');
    _price = TextEditingController(text: p?.price.toStringAsFixed(2) ?? '');
    _description = TextEditingController(text: p?.description ?? '');
    _volume = TextEditingController(text: p?.volume.toString() ?? '0');
  }

  @override
  void dispose() {
    _name.dispose();
    _symbol.dispose();
    _category.dispose();
    _price.dispose();
    _description.dispose();
    _volume.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final app = context.read<AppState>();
    if (widget.product == null) {
      final now = DateTime.now().millisecondsSinceEpoch;
      app.addProduct(Product(
        id: 'new_$now',
        name: _name.text.trim(),
        symbol: _symbol.text.trim().toUpperCase(),
        category: _category.text.trim(),
        description: _description.text.trim(),
        price: double.tryParse(_price.text) ?? 0,
        changePercent24h: 0,
        changePercentWeek: 0,
        priceHistory:
            List.generate(20, (i) => double.tryParse(_price.text) ?? 0),
        icon: Icons.local_cafe_outlined,
        accent: AppColors.accentPrimary,
        volume: int.tryParse(_volume.text) ?? 0,
      ));
    } else {
      app.updateProduct(widget.product!.copyWith(
        name: _name.text.trim(),
        symbol: _symbol.text.trim().toUpperCase(),
        category: _category.text.trim(),
        description: _description.text.trim(),
        price: double.tryParse(_price.text) ?? widget.product!.price,
        volume: int.tryParse(_volume.text) ?? widget.product!.volume,
      ));
    }
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(widget.product == null
              ? 'Producto creado'
              : 'Producto actualizado')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.product != null;
    return Dialog(
      backgroundColor: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(isEdit ? 'Editar producto' : 'Nuevo producto',
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Nombre'),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _symbol,
                        decoration: const InputDecoration(
                            labelText: 'Símbolo (ticker)'),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? 'Requerido' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _category,
                        decoration:
                            const InputDecoration(labelText: 'Categoría'),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? 'Requerido' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _price,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                            labelText: 'Precio', prefixText: '\$ '),
                        validator: (v) =>
                            double.tryParse(v ?? '') == null ? 'Número' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _volume,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Volumen'),
                        validator: (v) =>
                            int.tryParse(v ?? '') == null ? 'Entero' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _description,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancelar'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: _save,
                      icon: Icon(isEdit ? Icons.save : Icons.add),
                      label: Text(isEdit ? 'Guardar' : 'Crear'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
