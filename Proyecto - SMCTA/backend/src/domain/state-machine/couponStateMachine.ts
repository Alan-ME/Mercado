import { CouponState } from '../entities/index.js';
import { CouponNotInWalletError } from '../../shared/errors.js';

export class CouponStateMachine {
  private static readonly VALID_TRANSITIONS: Record<CouponState, CouponState[]> = {
    [CouponState.EMITIDO]: [CouponState.EN_WALLET],
    [CouponState.EN_WALLET]: [CouponState.PUBLICADO_P2P, CouponState.CANJEADO, CouponState.VENCIDO],
    [CouponState.PUBLICADO_P2P]: [CouponState.EN_WALLET, CouponState.VENCIDO],
    [CouponState.CANJEADO]: [],
    [CouponState.VENCIDO]: []
  };

  public static canTransition(current: CouponState, next: CouponState): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static assertInWallet(current: CouponState): void {
    if (current !== CouponState.EN_WALLET) {
      throw new CouponNotInWalletError(
        `Operación rechazada: el cupón está en estado '${current}', se requiere 'EN_WALLET'.`
      );
    }
  }

  public static assertTransition(current: CouponState, next: CouponState): void {
    if (!this.canTransition(current, next)) {
      throw new CouponNotInWalletError(
        `Transición no permitida: de '${current}' a '${next}'.`
      );
    }
  }
}
