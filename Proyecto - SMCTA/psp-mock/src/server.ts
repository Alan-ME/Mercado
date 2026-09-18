import { createApp } from './app';
import { config } from './config';

const app = createApp();

console.log('='.repeat(60));
console.log('💳 Iniciando SMCTA PSP & Escrow Simulator (Rol 3)...');
console.log('='.repeat(60));
console.log(`[Destino Checkout Primary]: ${config.backendCoreWebhookUrl}`);
console.log(`[Destino Escrow Release]:   ${config.backendCoreEscrowReleaseUrl}`);

app.listen(config.port, () => {
  console.log(`[PSP Simulator]: 🟢 Escuchando en http://localhost:${config.port}`);
  console.log(`[Health Endpoint]: http://localhost:${config.port}/health`);
  console.log(`[Webhooks History]: http://localhost:${config.port}/psp/escrow/webhooks/history`);
  console.log('='.repeat(60));
});
