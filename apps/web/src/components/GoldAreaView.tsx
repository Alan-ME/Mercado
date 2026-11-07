import { useState } from 'react';
import { Coins, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import {
  GOLD_AREA_PROMOS,
  spendUnlockedGold,
  type GoldPromoCard,
} from '../state/goldEconomy';
import { api } from '../api/client';
import { useToast } from '../ui/toast';
import { Card } from '../ui/kit';

interface GoldAreaProps {
  tenant: string | null;
  userId: string | undefined;
  unlockedGold: number;
  pendingGold: number;
  onRedeemed: () => void;
}

function GoldHeaderBanner({
  unlockedGold,
  pendingGold,
}: {
  unlockedGold: number;
  pendingGold: number;
}) {
  return (
    <Card className="mb-6 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-panel to-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
            <Sparkles size={14} /> GOLD AREA · COMBOS Y PROMOCIONES EXCLUSIVAS
          </div>
          <p className="max-w-2xl text-xs text-muted">
            Cada vez que intercambiás un producto en el P2P sumás Créditos Gold. Para evitar el
            farmeo entre cuentas, los créditos quedan <strong className="text-fg">Pendientes</strong>{' '}
            y <strong className="text-amber-400">SOLO se desbloquean cuando el otro usuario canjea el QR en el TPV</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-amber-500/50 bg-black/60 px-4 py-2.5 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Gold Disponible
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xl font-black tabular-nums text-amber-400">
              <Coins size={18} /> {unlockedGold} G
            </div>
          </div>

          <div className="rounded-xl border border-line bg-black/40 px-4 py-2.5 text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              <Lock size={11} /> Pendiente de TPV
            </div>
            <div className="text-xl font-black tabular-nums text-fg">{pendingGold} G</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function GoldPromoCardItem({
  promo,
  canAfford,
  busy,
  onClaim,
}: {
  promo: GoldPromoCard;
  canAfford: boolean;
  busy: boolean;
  onClaim: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b ${promo.bgGradient} p-5 shadow-xl transition-all hover:-translate-y-1 hover:border-amber-400`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
          {promo.codeName}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-black/80 px-3 py-1 text-xs font-black tabular-nums text-amber-400 shadow-md">
          <Coins size={13} /> {promo.costGold} G
        </span>
      </div>

      <div className="my-5 flex h-40 items-center justify-center">
        <img
          src={promo.image}
          alt={promo.productName}
          className="h-36 max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-tight text-white">
          {promo.productName}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-stone-300">{promo.subtitle}</p>

        <button
          onClick={onClaim}
          disabled={!canAfford || busy}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShieldCheck size={15} />
          {canAfford ? `Canjear por ${promo.costGold} G` : `Faltan ${promo.costGold} G`}
        </button>
      </div>
    </div>
  );
}

export function GoldAreaView({
  tenant,
  userId,
  unlockedGold,
  pendingGold,
  onRedeemed,
}: GoldAreaProps) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const claimPromo = async (promo: GoldPromoCard) => {
    if (!tenant || !userId) return;
    if (!spendUnlockedGold(promo.costGold)) {
      toast.push('error', 'No tenés suficientes Créditos Gold desbloqueados.');
      return;
    }

    setBusyId(promo.id);
    try {
      await api.checkout(tenant, {
        buyerId: userId,
        nominalPrice: promo.nominalEquivalent,
        productName: promo.productName,
      });
      toast.push(
        'success',
        `¡Canjeaste ${promo.codeName} (${promo.productName}) con ${promo.costGold} G! Ya tenés el QR en tu Billetera.`,
      );
      onRedeemed();
    } catch {
      toast.push('error', 'Error al emitir el combo de Gold Area.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <GoldHeaderBanner unlockedGold={unlockedGold} pendingGold={pendingGold} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GOLD_AREA_PROMOS.map((promo) => (
          <GoldPromoCardItem
            key={promo.id}
            promo={promo}
            canAfford={unlockedGold >= promo.costGold}
            busy={busyId === promo.id}
            onClaim={() => void claimPromo(promo)}
          />
        ))}
      </div>
    </div>
  );
}

