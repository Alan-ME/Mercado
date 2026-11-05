import { useState, useMemo } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { COFFEE_PRODUCTS, type CoffeeProduct } from '../data/coffeeCatalog';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { useCart } from '../state/cart';
import { Card, money } from '../ui/kit';

const CATEGORIES = ['Todos', 'Combos', 'Espresso', 'Con leche', 'Frío', 'Postres'] as const;

export function CartaPage() {
  const [selectedCat, setSelectedCat] = useState<string>('Todos');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [activeProduct, setActiveProduct] = useState<CoffeeProduct | null>(null);
  const { addToCart } = useCart();

  const filtered = useMemo(() => {
    return COFFEE_PRODUCTS.filter((p) => {
      const matchCat = selectedCat === 'Todos' || p.category === selectedCat;
      const matchQ =
        query === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.symbol.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    }).sort((a, b) => {
      if (sortBy === 'trending') return b.change24h - a.change24h;
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'volume') return b.ordersToday - a.ordersToday;
      return 0;
    });
  }, [selectedCat, query, sortBy]);

  return (
    <div className="mx-auto max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-fg tracking-tight">La carta</h1>
        <p className="mt-1 text-sm text-muted">
          Carta viva — los precios y la disponibilidad se ajustan con la demanda en tiempo real.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                selectedCat === cat
                  ? 'bg-brand-primary text-black shadow-sm'
                  : 'bg-raised/60 text-muted hover:text-fg'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs text-fg placeholder-muted outline-none focus:border-brand-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-line bg-canvas py-1.5 px-3 text-xs font-semibold text-fg outline-none focus:border-brand-primary"
          >
            <option value="trending">Más subieron hoy</option>
            <option value="volume">Más pedidos</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <CartaItemCard
            key={product.id}
            product={product}
            onSelect={() => setActiveProduct(product)}
            onOrder={() => addToCart(product)}
          />
        ))}
      </div>

      {activeProduct && (
        <ProductDetailModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}
    </div>
  );
}

function CartaItemCard({
  product,
  onSelect,
  onOrder,
}: {
  product: CoffeeProduct;
  onSelect: () => void;
  onOrder: () => void;
}) {
  return (
    <Card className="group flex flex-col justify-between overflow-hidden p-4 transition-all hover:-translate-y-1 hover:border-brand-primary/50">
      <div onClick={onSelect} className="cursor-pointer">
        <div
          className={`relative flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br ${product.glowGradient} p-2`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-36 max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          />
          <span
            className="absolute right-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md"
            style={{ backgroundColor: product.tagColor || product.badgeColor || '#00D9A3' }}
          >
            {product.categoryTag}
          </span>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {product.symbol}
          </div>
          <h3 className="mt-0.5 text-sm font-extrabold text-fg group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-base font-black text-fg tabular-nums">{money(product.price)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95"
        >
          <ShoppingBag size={14} /> + Pedir
        </button>
      </div>
    </Card>
  );
}
