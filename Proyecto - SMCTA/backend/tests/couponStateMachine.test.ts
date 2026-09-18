import { describe, it, expect } from 'vitest';
import { CouponStateMachine } from '../src/domain/state-machine/couponStateMachine.js';
import { CouponState } from '../src/domain/entities/index.js';
import { CouponNotInWalletError } from '../src/shared/errors.js';

describe('CouponStateMachine (Máquina de Estados Finita ST-01 a ST-05)', () => {
  it('debe permitir transiciones válidas según el flujo determinista', () => {
    expect(CouponStateMachine.canTransition(CouponState.EMITIDO, CouponState.EN_WALLET)).toBe(true);
    expect(CouponStateMachine.canTransition(CouponState.EN_WALLET, CouponState.PUBLICADO_P2P)).toBe(true);
    expect(CouponStateMachine.canTransition(CouponState.PUBLICADO_P2P, CouponState.EN_WALLET)).toBe(true);
    expect(CouponStateMachine.canTransition(CouponState.EN_WALLET, CouponState.CANJEADO)).toBe(true);
    expect(CouponStateMachine.canTransition(CouponState.EN_WALLET, CouponState.VENCIDO)).toBe(true);
  });

  it('debe rechazar transiciones no permitidas (exclusividad mutua RN-01)', () => {
    expect(CouponStateMachine.canTransition(CouponState.PUBLICADO_P2P, CouponState.CANJEADO)).toBe(false);
    expect(CouponStateMachine.canTransition(CouponState.CANJEADO, CouponState.EN_WALLET)).toBe(false);
    expect(CouponStateMachine.canTransition(CouponState.VENCIDO, CouponState.EN_WALLET)).toBe(false);
  });

  it('assertInWallet debe lanzar CouponNotInWalletError (HTTP 409) si no está EN_WALLET', () => {
    expect(() => {
      CouponStateMachine.assertInWallet(CouponState.PUBLICADO_P2P);
    }).toThrowError(CouponNotInWalletError);

    expect(() => {
      CouponStateMachine.assertInWallet(CouponState.CANJEADO);
    }).toThrowError(CouponNotInWalletError);

    expect(() => {
      CouponStateMachine.assertInWallet(CouponState.EN_WALLET);
    }).not.toThrow();
  });
});
