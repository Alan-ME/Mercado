import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';

const PRODUCTS = [
  { name: 'Entrada VIP - Cosmic Fest', price: 100, emoji: '🎫' },
  { name: 'Drop Air Limited - Par #051', price: 200, emoji: '👟' },
  { name: 'Suite Fin de Semana', price: 300, emoji: '🏨' },
];

export function Storefront() {
  const { tenant, user } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (name: string, price: number) => {
    if (!tenant || !user) {
      toast.push('error', 'Seleccioná un usuario primero.');
      return;
    }
    setBusy(name);
    try {
      await api.checkout(tenant, { nominalPrice: price, buyerId: user.userId, productName: name });
      toast.push('success', `Cupón emitido y depositado en Escrow. Revisá tu Billetera.`);
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'Error en el checkout.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Tienda primaria</h1>
        <p className="text-sm text-slate-500">
          Comprá un cupón de reserva. El importe queda en custodia (Escrow segregado) hasta el canje.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <div key={p.name} className="rounded-brand bg-white p-5 shadow-sm">
            <div className="mb-3 text-4xl">{p.emoji}</div>
            <h3 className="font-semibold text-slate-900">{p.name}</h3>
            <div className="mt-1 text-2xl font-bold text-[var(--smcta-brand-primary)]">
              ${p.price.toFixed(2)}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
              <ShieldCheck size={14} /> Custodia en Escrow segregada
            </div>
            <button
              onClick={() => buy(p.name, p.price)}
              disabled={busy !== null}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-brand py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: 'var(--smcta-brand-primary)' }}
            >
              {busy === p.name ? <Loader2 className="animate-spin" size={16} /> : null}
              Comprar cupón
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
