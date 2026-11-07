import { useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { COFFEE_PRODUCTS, type CoffeeProduct } from '../data/coffeeCatalog';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { useCart } from '../state/cart';
import { Card, money } from '../ui/kit';

export function Storefront() {
  const [activeProduct, setActiveProduct] = useState<CoffeeProduct | null>(null);
  const { addToCart } = useCart();

  const promos = COFFEE_PRODUCTS.slice(0, 3);
  const featured = COFFEE_PRODUCTS.slice(3, 7);

  return (
    <div className="mx-auto max-w-7xl space-y-10 py-6">
      {/* 1. Hero Banner Principal */}
      <StorefrontHero onExplore={() => (window.location.hash = '#/carta')} />

      {/* 2. Sección: Promos de la barra */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-fg sm:text-2xl">
            Promos de la barra
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Combos armados para hoy — ideales para arrancar el día
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <PromoCard
              key={p.id}
              product={p}
              onSelect={() => setActiveProduct(p)}
              onOrder={() => addToCart(p)}
            />
          ))}
        </div>
      </section>

      {/* 3. Sección: Nuestra carta destacada */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-fg sm:text-2xl">
              Nuestra carta destacada
            </h2>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Los favoritos de la semana con opciones para cada hora
            </p>
          </div>
          <button
            onClick={() => (window.location.hash = '#/carta')}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-accent hover:underline"
          >
            Ver toda la carta <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <FeaturedCard
              key={p.id}
              product={p}
              onSelect={() => setActiveProduct(p)}
              onOrder={() => addToCart(p)}
            />
          ))}
        </div>
      </section>

      {/* 4. Banner inferior: Club de la barra */}
      <ClubBanner />

      {/* Modal de detalle si el usuario toca cualquier tarjeta */}
      {activeProduct && (
        <ProductDetailModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}
    </div>
  );
}

function StorefrontHero({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-panel via-raised/90 to-panel shadow-2xl">
      <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:p-10">
        <div className="space-y-4 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-warn">
            <span className="h-2 w-2 rounded-full bg-up animate-pulse" />
            <span>BARRA ABIERTA · HOY</span>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tight text-fg sm:text-4xl lg:text-5xl leading-tight">
            BUEN DÍA.
            <br />
            <span className="text-brand-primary">HOY HAY CAFÉ RECIÉN TOSTADO.</span>
          </h1>

          <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-muted">
            Elegí tu combo, sumá algo dulce o entrá directo a la carta. Cada taza se prepara al
            momento — pedí y pasá a buscar por la barra.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onExplore}
              className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg transition-all hover:brightness-110 active:scale-95"
            >
              Ver la carta
            </button>
            <button
              onClick={() => (window.location.hash = '#/wallet')}
              className="rounded-xl border border-line bg-panel/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-all hover:bg-raised active:scale-95"
            >
              Cupones de la semana
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-xl border border-line/60 bg-black/40 shadow-inner">
            <img
              src="/images/carta/fondo banner.png"
              alt="Coffee Trading"
              className="h-56 w-full object-cover object-center brightness-95 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">
                  COFFEE TRADING
                </div>
                <div className="text-[10px] text-muted">Mesa de liquidez y canje en mostrador</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoCard({
  product,
  onSelect,
  onOrder,
}: {
  product: CoffeeProduct;
  onSelect: () => void;
  onOrder: () => void;
}) {
  return (
    <Card className="group flex flex-col justify-between overflow-hidden p-5 transition-all hover:-translate-y-1 hover:border-brand-primary/50">
      <div onClick={onSelect} className="cursor-pointer space-y-4">
        <div
          className={`relative flex h-52 w-full items-center justify-center rounded-xl bg-gradient-to-br ${product.glowGradient} p-4`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-44 max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          />
          {product.badge && (
            <span
              className="absolute right-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-md"
              style={{ backgroundColor: product.badgeColor || '#F59E0B' }}
            >
              {product.badge}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-extrabold uppercase tracking-tight text-fg group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {product.description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xl font-black text-fg tabular-nums">{money(product.price)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95"
        >
          <ShoppingBag size={14} /> + Pedir
        </button>
      </div>
    </Card>
  );
}

function FeaturedCard({
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
      <div onClick={onSelect} className="cursor-pointer space-y-3">
        <div
          className={`relative flex h-40 w-full items-center justify-center rounded-xl bg-gradient-to-br ${product.glowGradient} p-2`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-32 max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          />
          <span
            className="absolute right-2.5 top-2.5 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-sm"
            style={{ backgroundColor: product.tagColor || product.badgeColor || '#00D9A3' }}
          >
            {product.categoryTag}
          </span>
        </div>

        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-tight text-fg group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
            {product.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm font-black text-fg tabular-nums">{money(product.price)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder();
          }}
          className="flex items-center gap-1 rounded-md bg-brand-accent px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95"
        >
          <ShoppingBag size={13} /> + Pedir
        </button>
      </div>
    </Card>
  );
}

function ClubBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-panel via-raised/80 to-panel p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-base font-extrabold uppercase tracking-tight text-fg sm:text-lg">
            ¿Querés sumarte al club de la barra?
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Intercambiá productos mano a mano en el P2P, sumá Créditos Gold cuando se canjean en
            barra y desbloqueá combos exclusivos en el Gold Area.
          </p>
        </div>

        <button
          onClick={() => (window.location.hash = '#/settings')}
          className="shrink-0 rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95"
        >
          Crear mi cuenta
        </button>
      </div>
    </div>
  );
}
