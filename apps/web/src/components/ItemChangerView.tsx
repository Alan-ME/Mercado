import { useState } from 'react';
import { ArrowRightLeft, Coins, RotateCcw, Search, Sparkles } from 'lucide-react';
import { COFFEE_PRODUCTS, type CoffeeProduct } from '../data/coffeeCatalog';
import {
  consumeDiscontinuedInChanger,
  resetDiscontinuedDemo,
  type DiscontinuedItem,
} from '../state/goldEconomy';
import { api } from '../api/client';
import { useToast } from '../ui/toast';
import { Badge, Button, Card } from '../ui/kit';

interface ItemChangerProps {
  tenant: string | null;
  userId: string | undefined;
  discontinued: DiscontinuedItem[];
  onCompleted: () => void;
}

const CATS = ['Todos', 'Combos', 'Espresso', 'Con leche', 'Frío', 'Postres'] as const;

function matchesFilter(p: CoffeeProduct, cat: string, q: string): boolean {
  const catOk = cat === 'Todos' || p.category === cat;
  const qOk = q === '' || p.name.toLowerCase().includes(q.toLowerCase());
  return catOk && qOk;
}

function resolveActiveDiscontinued(
  items: DiscontinuedItem[],
  selectedId: string,
): DiscontinuedItem | undefined {
  return items.find((d) => d.id === selectedId) ?? items[0];
}

function LeftDiscontinuedPanel({
  items,
  selectedId,
  onSelect,
  onResetDemo,
}: {
  items: DiscontinuedItem[];
  selectedId: string;
  onSelect: (item: DiscontinuedItem) => void;
  onResetDemo: () => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <Sparkles size={32} className="text-brand-accent" />
        <div className="mt-3 text-sm font-extrabold uppercase text-fg">
          No tenés productos descontinuados pendientes
        </div>
        <p className="mt-1 text-xs text-muted">
          Todos tus cupones retirados de carta ya fueron canjeados por equivalentes activos.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onResetDemo}>
          <RotateCcw size={14} /> Cargar cupón descontinuado de prueba
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-fg">
            1. Elige tu producto descontinuado
          </div>
          <div className="text-[11px] text-muted">
            Ítems dados de baja de la carta habilitados para rescate con incentivo
          </div>
        </div>
        <Badge tone="warn">DESCONTINUADO</Badge>
      </div>

      <div className="space-y-2.5 pt-1">
        {items.map((item) => {
          const isSel = item.id === selectedId;
          const border = isSel
            ? 'border-brand-accent bg-brand-accent/10 shadow-md'
            : 'border-line bg-canvas hover:bg-raised';
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition ${border}`}
            >
              <img
                src={item.image}
                alt={item.productName}
                className="h-14 w-14 rounded-lg bg-panel object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-extrabold uppercase text-fg">
                  {item.productName}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-muted">{item.reason}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
                  <Coins size={11} /> +{item.bonusGold} G DE INCENTIVO AL CAMBIAR
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function CenterChangerBridge({
  leftItem,
  rightItem,
  busy,
  onSwap,
}: {
  leftItem: DiscontinuedItem | undefined;
  rightItem: CoffeeProduct;
  busy: boolean;
  onSwap: () => void;
}) {
  const bonus = leftItem ? leftItem.bonusGold : 0;
  const leftLabel = leftItem ? leftItem.productName : '— Elegí a la izquierda —';
  const btnText = busy ? 'Procesando cambio...' : 'Intercambiar producto';

  return (
    <Card className="flex flex-col items-center justify-between gap-4 border-brand-accent/40 bg-gradient-to-b from-panel to-canvas p-5 text-center">
      <div className="text-[10px] font-black uppercase tracking-widest text-muted">
        BALANCEADOR DE EQUIVALENCIA · ITEM CHANGER
      </div>

      <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
        <div className="text-[10px] font-bold uppercase text-amber-300">
          INCENTIVO POR DESCONTINUACIÓN (+15%)
        </div>
        <div className="mt-1 text-2xl font-black tabular-nums text-amber-400">+{bonus} G</div>
        <div className="mt-0.5 text-[11px] text-muted">
          Créditos Gold acreditados al instante + tu nuevo producto en Billetera
        </div>
      </div>

      <div className="w-full space-y-2 text-xs">
        <div className="rounded-lg border border-line bg-canvas p-2.5">
          <div className="text-[10px] uppercase text-muted">Entregás (Descontinuado)</div>
          <div className="mt-0.5 truncate font-extrabold text-fg">{leftLabel}</div>
        </div>
        <ArrowRightLeft size={18} className="mx-auto text-brand-accent" />
        <div className="rounded-lg border border-line bg-canvas p-2.5">
          <div className="text-[10px] uppercase text-muted">Recibís en Billetera</div>
          <div className="mt-0.5 truncate font-extrabold text-brand-accent">{rightItem.name}</div>
        </div>
      </div>

      <button
        onClick={onSwap}
        disabled={!leftItem || busy}
        className="w-full rounded-xl bg-brand-accent py-3 text-xs font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-40"
      >
        {btnText}
      </button>
    </Card>
  );
}

function RightCatalogSelector({
  selectedProduct,
  onSelectProduct,
}: {
  selectedProduct: CoffeeProduct;
  onSelectProduct: (p: CoffeeProduct) => void;
}) {
  const [cat, setCat] = useState<string>('Todos');
  const [q, setQ] = useState('');
  const list = COFFEE_PRODUCTS.filter((p) => matchesFilter(p, cat, q));

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-fg">
            2. Elegir producto equivalente a recibir
          </div>
          <div className="text-[11px] text-muted">
            Seleccioná cualquier producto o combo activo de la barra
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar equivalente..."
            className="rounded-lg border border-line bg-canvas py-1 pl-7 pr-2.5 text-xs text-fg outline-none focus:border-brand-accent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase transition ${
              cat === c ? 'bg-brand-accent text-black' : 'bg-canvas text-muted hover:text-fg'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid max-h-80 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
        {list.map((p) => {
          const active = p.id === selectedProduct.id;
          const cls = active
            ? 'border-brand-accent bg-brand-accent/15'
            : 'border-line bg-canvas hover:bg-raised';
          return (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${cls}`}
            >
              <img src={p.image} alt={p.name} className="h-16 w-16 object-contain" />
              <span className="mt-1.5 line-clamp-1 text-[11px] font-extrabold uppercase text-fg">
                {p.name}
              </span>
              <span className="mt-0.5 text-[10px] font-bold text-brand-accent">{p.category}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ItemChangerView({
  tenant,
  userId,
  discontinued,
  onCompleted,
}: ItemChangerProps) {
  const toast = useToast();
  const [selectedLeftId, setSelectedLeftId] = useState<string>('');
  const [selectedRight, setSelectedRight] = useState<CoffeeProduct>(COFFEE_PRODUCTS[0]!);
  const [busy, setBusy] = useState(false);

  const leftItem = resolveActiveDiscontinued(discontinued, selectedLeftId);

  const executeChangerSwap = async (t: string, uid: string, item: DiscontinuedItem) => {
    setBusy(true);
    try {
      await api.checkout(t, {
        buyerId: uid,
        nominalPrice: selectedRight.price,
        productName: selectedRight.name,
      });
      consumeDiscontinuedInChanger(item.id);
      toast.push(
        'success',
        `¡Cambiaste tu ${item.productName} por ${selectedRight.name} y recibiste +${item.bonusGold} G de incentivo!`,
      );
      onCompleted();
    } catch {
      toast.push('error', 'No se pudo procesar el reemplazo en el Item Changer.');
    } finally {
      setBusy(false);
    }
  };

  const handleSwap = async () => {
    if (!tenant || !userId || !leftItem) return;
    await executeChangerSwap(tenant, userId, leftItem);
  };

  const handleReset = () => {
    resetDiscontinuedDemo();
    onCompleted();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <LeftDiscontinuedPanel
          items={discontinued}
          selectedId={leftItem ? leftItem.id : ''}
          onSelect={(item) => setSelectedLeftId(item.id)}
          onResetDemo={handleReset}
        />
      </div>

      <div className="lg:col-span-3">
        <CenterChangerBridge
          leftItem={leftItem}
          rightItem={selectedRight}
          busy={busy}
          onSwap={() => void handleSwap()}
        />
      </div>

      <div className="lg:col-span-5">
        <RightCatalogSelector
          selectedProduct={selectedRight}
          onSelectProduct={setSelectedRight}
        />
      </div>
    </div>
  );
}
