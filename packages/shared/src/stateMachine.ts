import { CouponState } from './dtos.js';

/**
 * Máquina de estados finitos del cupón (REQ-002 §1).
 *
 *   EMITIDO ──> EN_WALLET <──> PUBLICADO_P2P
 *                   │                │
 *                   └────> CANJEADO  │
 *                   └────> VENCIDO <─┘
 *
 * Transiciones permitidas (origen -> destinos válidos).
 */
// La máquina de estados es unidireccional hacia los estados terminales.
// Un cupón CANJEADO o VENCIDO no puede revivir jamás, ni por error de red ni por reintento.
// Tampoco se puede pasar de PUBLICADO_P2P directo a CANJEADO: si el usuario está en la puerta
// del boliche queriendo canjear, primero tiene que cancelar la venta en el marketplace para evitar
// la carrera donde el cajero le valida la entrada al mismo milisegundo que otro se la compra online.
export const ALLOWED_TRANSITIONS: Record<CouponState, CouponState[]> = {
  [CouponState.EMITIDO]: [CouponState.EN_WALLET],
  [CouponState.EN_WALLET]: [
    CouponState.PUBLICADO_P2P,
    CouponState.CANJEADO,
    CouponState.VENCIDO,
  ],
  [CouponState.PUBLICADO_P2P]: [CouponState.EN_WALLET, CouponState.VENCIDO],
  [CouponState.CANJEADO]: [], // terminal definitivo, plata liberada al comercio
  [CouponState.VENCIDO]: [], // terminal definitivo, expirado por breakage/devolución
};

export function canTransition(from: CouponState, to: CouponState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// RN-01: Sólo EN_WALLET admite canje. Si está en venta P2P o emitido sin aceptar, rebota.
export function allowsRedeem(state: CouponState): boolean {
  return state === CouponState.EN_WALLET;
}

// RN-01: Sólo EN_WALLET admite publicarse en el mercado. No podés vender algo que ya canjeaste o venció.
export function allowsResale(state: CouponState): boolean {
  return state === CouponState.EN_WALLET;
}

export function isTerminal(state: CouponState): boolean {
  return state === CouponState.CANJEADO || state === CouponState.VENCIDO;
}
