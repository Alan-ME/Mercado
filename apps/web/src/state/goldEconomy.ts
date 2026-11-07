import { COFFEE_PRODUCTS, type CoffeeProduct } from '../data/coffeeCatalog';

// Persistencia ligera en localStorage para que el flujo completo (Trade P2P -> Pendiente -> Canje en TPV -> Desbloqueo -> Gold Area)
// funcione de punta a punta mientras probás en el navegador sin romper los contratos existentes del backend.
const STORAGE_KEY = 'smcta_v22_gold_economy';

export interface GoldPromoCard {
  id: string;
  codeName: string;
  productName: string;
  subtitle: string;
  costGold: number;
  nominalEquivalent: number;
  image: string;
  accentHex: string;
  bgGradient: string;
}

export interface DiscontinuedItem {
  id: string;
  productName: string;
  reason: string;
  nominalPrice: number;
  bonusGold: number;
  image: string;
}

export interface PendingTradeReward {
  couponId: string;
  productName: string;
  rewardGold: number;
  recipientUserId: string;
  claimed: boolean;
}

export interface OrderTradeSpec {
  orderId: string;
  offeredProduct: string;
  requestedProduct: string;
  rewardGold: number;
}

interface EconomyState {
  unlockedGold: number;
  pendingRewards: Record<string, PendingTradeReward>;
  orderSpecs: Record<string, OrderTradeSpec>;
  discontinuedItems: DiscontinuedItem[];
}

export const GOLD_AREA_PROMOS: GoldPromoCard[] = [
  {
    id: 'gold-digger',
    codeName: 'GOLD DIGGER',
    productName: 'COMBO ESPRESSO + ALFAJOR ARTESANAL',
    subtitle: 'Doble shot colombiano + alfajor de almendras y dulce de leche',
    costGold: 480,
    nominalEquivalent: 4.9,
    image: '/images/carta/1.png',
    accentHex: '#F59E0B',
    bgGradient: 'from-amber-500/30 via-yellow-900/40 to-black',
  },
  {
    id: 'foster',
    codeName: 'FOSTER',
    productName: 'MATCHA LATTE + CROISSANT FRANCÉS',
    subtitle: 'Matcha ceremonial Uji Japón + croissant tibio de manteca',
    costGold: 610,
    nominalEquivalent: 5.5,
    image: '/images/carta/6.png',
    accentHex: '#22C55E',
    bgGradient: 'from-emerald-500/30 via-green-950/40 to-black',
  },
  {
    id: 'shark',
    codeName: 'SHARK',
    productName: 'SÁNDWICH BRIOCHE + FLAT WHITE',
    subtitle: 'Almuerzo de barra completo + doble ristretto texturizado',
    costGold: 680,
    nominalEquivalent: 6.2,
    image: '/images/carta/2.png',
    accentHex: '#38BDF8',
    bgGradient: 'from-sky-500/30 via-blue-950/40 to-black',
  },
  {
    id: 'topaz',
    codeName: 'TOPAZ',
    productName: 'DOBLE AFFOGATO + DEGUSTACIÓN ORIGEN',
    subtitle: 'Dos copas de helado artesanal ahogadas en espresso intenso',
    costGold: 840,
    nominalEquivalent: 7.5,
    image: '/images/carta/4.png',
    accentHex: '#EAB308',
    bgGradient: 'from-yellow-500/30 via-stone-900/50 to-black',
  },
  {
    id: 'rubin-rain',
    codeName: 'RUBIN RAIN',
    productName: 'PACK MERIENDA PARA DOS (2 MOKACCINOS + 2 MEDIALUNAS)',
    subtitle: 'Ideal para compartir en mesa: chocolate belga 70% y hojaldre',
    costGold: 1200,
    nominalEquivalent: 9.8,
    image: '/images/carta/3.png',
    accentHex: '#EF4444',
    bgGradient: 'from-rose-500/30 via-red-950/40 to-black',
  },
  {
    id: 'predator',
    codeName: 'PREDATOR',
    productName: 'PASE CATA BARISTA + BOLSA 250G GRANO ESPECIALIDAD',
    subtitle: 'Experiencia completa en barra + bolsa de grano recién tostado',
    costGold: 1400,
    nominalEquivalent: 12.0,
    image: '/images/carta/7.png',
    accentHex: '#10B981',
    bgGradient: 'from-teal-500/30 via-emerald-950/40 to-black',
  },
];

const INITIAL_DISCONTINUED: DiscontinuedItem[] = [
  {
    id: 'disc-pumpkin',
    productName: 'LATTE PUMPKIN SPICE (Edición Estacional)',
    reason: 'Producto retirado de la carta de temporada — elegí tu equivalente con +15% de bonus',
    nominalPrice: 5.2,
    bonusGold: 160,
    image: '/images/carta/5.png',
  },
  {
    id: 'disc-coldbrew',
    productName: 'COLD BREW TÓNICA & NARANJA',
    reason: 'Lote estacional agotado en barra — rescate habilitado en Item Changer',
    nominalPrice: 4.8,
    bonusGold: 140,
    image: '/images/carta/6.png',
  },
];

function defaultState(): EconomyState {
  return {
    unlockedGold: 520,
    pendingRewards: {},
    orderSpecs: {},
    discontinuedItems: INITIAL_DISCONTINUED,
  };
}

function parseStoredState(raw: string | null): EconomyState {
  if (!raw) return defaultState();
  try {
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<EconomyState>) };
  } catch {
    return defaultState();
  }
}

export function loadEconomyState(): EconomyState {
  if (typeof window === 'undefined') return defaultState();
  return parseStoredState(window.localStorage.getItem(STORAGE_KEY));
}

function saveEconomyState(state: EconomyState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Calcula cuántos Créditos Gold genera un producto al ser intercambiado en el P2P
export function computeTradeRewardGold(productName: string): number {
  const found = COFFEE_PRODUCTS.find((p) => p.name.toLowerCase() === productName.toLowerCase());
  return found ? found.tradeRewardGold : 50;
}

export function findCatalogVisual(productName: string): CoffeeProduct {
  const match = COFFEE_PRODUCTS.find((p) =>
    productName.toLowerCase().includes(p.name.toLowerCase()),
  );
  return match ?? COFFEE_PRODUCTS[0]!;
}

// Registra qué producto se pide a cambio cuando un usuario publica su cupón en el P2P
export function registerPublishedSwap(
  orderId: string,
  couponId: string,
  offeredProduct: string,
  requestedProduct: string,
  sellerUserId: string,
): void {
  const st = loadEconomyState();
  const sameProduct = offeredProduct.trim().toLowerCase() === requestedProduct.trim().toLowerCase();
  const rewardGold = sameProduct ? 0 : computeTradeRewardGold(offeredProduct);

  st.orderSpecs[orderId] = { orderId, offeredProduct, requestedProduct, rewardGold };
  const existing = st.pendingRewards[couponId];
  // Candado anti-farmeo: si el cupón ya desbloqueó recompensa antes (claimed), no vuelve a sumar
  if (!existing?.claimed && rewardGold > 0) {
    st.pendingRewards[couponId] = {
      couponId,
      productName: offeredProduct,
      rewardGold,
      recipientUserId: sellerUserId,
      claimed: false,
    };
  }
  saveEconomyState(st);
}

// Se ejecuta recién cuando el QR se escanea en el TPV (RN-07: Proof-of-Consumption)
export function unlockGoldOnTpvRedeem(couponId: string): number {
  const st = loadEconomyState();
  const pending = st.pendingRewards[couponId];
  if (!pending || pending.claimed) return 0;

  pending.claimed = true;
  st.unlockedGold += pending.rewardGold;
  saveEconomyState(st);
  return pending.rewardGold;
}

export function getPendingGoldTotal(): number {
  const st = loadEconomyState();
  return Object.values(st.pendingRewards)
    .filter((r) => !r.claimed)
    .reduce((sum, r) => sum + r.rewardGold, 0);
}

export function consumeDiscontinuedInChanger(itemId: string): DiscontinuedItem | null {
  const st = loadEconomyState();
  const target = st.discontinuedItems.find((i) => i.id === itemId);
  if (!target) return null;

  st.discontinuedItems = st.discontinuedItems.filter((i) => i.id !== itemId);
  st.unlockedGold += target.bonusGold;
  saveEconomyState(st);
  return target;
}

export function resetDiscontinuedDemo(): void {
  const st = loadEconomyState();
  st.discontinuedItems = INITIAL_DISCONTINUED;
  saveEconomyState(st);
}

export function spendUnlockedGold(costGold: number): boolean {
  const st = loadEconomyState();
  if (st.unlockedGold < costGold) return false;
  st.unlockedGold -= costGold;
  saveEconomyState(st);
  return true;
}
