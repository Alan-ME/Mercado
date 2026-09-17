import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { escrowService } from '../src/services/escrow.service';
import { webhookService } from '../src/services/webhook.service';

const app = createApp();
const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111';

describe('PSP & Escrow Simulator (TASK-002 / Rol 3)', () => {
  beforeEach(() => {
    escrowService.reset();
    webhookService.clearHistory();
  });

  it('Debe responder 200 en /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('smcta-psp-mock');
  });

  it('Debe rechazar con HTTP 400 la creación de pago con parámetros inválidos', async () => {
    const res = await request(app)
      .post('/psp/payments/create')
      .send({ tenantId: '', amount: -10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('PARAMETROS_INVALIDOS');
  });

  it('Debe crear una intención de pago en estado REQUIRES_CAPTURE', async () => {
    const res = await request(app)
      .post('/psp/payments/create')
      .send({
        tenantId: TEST_TENANT_ID,
        userId: 'user_test_01',
        amount: 100.00,
        currency: 'USD',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^pi_mock_/);
    expect(res.body.amount).toBe(100.00);
    expect(res.body.status).toBe('REQUIRES_CAPTURE');
    expect(res.body.clientSecret).toBeDefined();
  });

  it('Debe simular aprobación de pago, acreditar en cuenta de custodia Escrow y registrar webhook', async () => {
    // 1. Crear intención
    const createRes = await request(app)
      .post('/psp/payments/create')
      .send({
        tenantId: TEST_TENANT_ID,
        userId: 'user_test_01',
        amount: 150.00,
      });

    const paymentIntentId = createRes.body.id;

    // 2. Simular éxito
    const successRes = await request(app)
      .post(`/psp/payments/${paymentIntentId}/simulate-success`)
      .send({ webhookUrl: 'http://localhost:9999/dummy-endpoint' }); // URL simulada no bloqueante

    expect(successRes.status).toBe(200);
    expect(successRes.body.paymentIntent.status).toBe('SUCCEEDED');

    // 3. Verificar saldo en custodia (balanceHeld)
    const balanceRes = await request(app).get(`/psp/escrow/balance/${TEST_TENANT_ID}`);
    expect(balanceRes.status).toBe(200);
    expect(balanceRes.body.balanceHeld).toBe(150.00);
    expect(balanceRes.body.transactions).toHaveLength(1);
    expect(balanceRes.body.transactions[0].type).toBe('HELD');

    // 4. Verificar registro de webhook
    const historyRes = await request(app).get('/psp/escrow/webhooks/history');
    expect(historyRes.body.total).toBe(1);
    expect(historyRes.body.history[0].event.type).toBe('payment_intent.succeeded');
  });

  it('Debe simular rechazo de pago sin alterar el balance de custodia', async () => {
    const createRes = await request(app)
      .post('/psp/payments/create')
      .send({
        tenantId: TEST_TENANT_ID,
        amount: 50.00,
      });

    const paymentIntentId = createRes.body.id;

    const failRes = await request(app)
      .post(`/psp/payments/${paymentIntentId}/simulate-failure`)
      .send({
        reason: 'TARJETA_DECLINADA_SIMULADA',
        webhookUrl: 'http://localhost:9999/dummy-endpoint',
      });

    expect(failRes.status).toBe(200);
    expect(failRes.body.paymentIntent.status).toBe('FAILED');
    expect(failRes.body.paymentIntent.failureReason).toBe('TARJETA_DECLINADA_SIMULADA');

    // El balance debe ser 0
    const balanceRes = await request(app).get(`/psp/escrow/balance/${TEST_TENANT_ID}`);
    expect(balanceRes.body.balanceHeld).toBe(0);
  });

  it('Debe liberar fondos de custodia (REDEEM_RELEASE) tras canje TPV', async () => {
    // 1. Crear y aprobar pago para fondear custodia
    const createRes = await request(app)
      .post('/psp/payments/create')
      .send({ tenantId: TEST_TENANT_ID, amount: 200.00 });
    await request(app)
      .post(`/psp/payments/${createRes.body.id}/simulate-success`)
      .send({ webhookUrl: 'http://localhost:9999/dummy' });

    // 2. Liberar fondos tras validación TPV
    const releaseRes = await request(app)
      .post('/psp/escrow/release')
      .send({
        tenantId: TEST_TENANT_ID,
        couponId: 'coupon_uuid_test',
        amount: 200.00,
        destinationBankAccountId: 'ES9121000418450200051332',
        webhookUrl: 'http://localhost:9999/dummy',
      });

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.account.balanceHeld).toBe(0);
    expect(releaseRes.body.account.totalReleased).toBe(200.00);

    // 3. Intento de liberar más fondos de los disponibles -> Error 400
    const overdrawRes = await request(app)
      .post('/psp/escrow/release')
      .send({
        tenantId: TEST_TENANT_ID,
        amount: 50.00,
      });

    expect(overdrawRes.status).toBe(400);
    expect(overdrawRes.body.error).toBe('ESCROW_RELEASE_FAILED');
  });
});
