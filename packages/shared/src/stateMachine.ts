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
export const ALLOWED_TRANSITIONS: Record<CouponState, CouponState[]> = {
  [CouponState.EMITIDO]: [CouponState.EN_WALLET],
  [CouponState.EN_WALLET]: [
    CouponState.PUBLICADO_P2P,
    CouponState.CANJEADO,
    CouponState.VENCIDO,
  ],
  [CouponState.PUBLICADO_P2P]: [CouponState.EN_WALLET, CouponState.VENCIDO],
  [CouponState.CANJEADO]: [], // terminal
  [CouponState.VENCIDO]: [], // terminal
};

export function canTransition(from: CouponState, to: CouponState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** RN-01: sólo EN_WALLET admite canje. */
export function allowsRedeem(state: CouponState): boolean {
  return state === CouponState.EN_WALLET;
}

/** RN-01: sólo EN_WALLET admite ser publicado a reventa P2P. */
export function allowsResale(state: CouponState): boolean {
  return state === CouponState.EN_WALLET;
}

export function isTerminal(state: CouponState): boolean {
  return state === CouponState.CANJEADO || state === CouponState.VENCIDO;
}
