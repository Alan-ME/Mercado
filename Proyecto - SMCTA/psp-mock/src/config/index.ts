import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || process.env.PSP_MOCK_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  backendCoreWebhookUrl: process.env.BACKEND_CORE_WEBHOOK_URL || 'http://localhost:3000/api/v1/checkout/primary',
  backendCoreEscrowReleaseUrl: process.env.BACKEND_CORE_ESCROW_RELEASE_URL || 'http://localhost:3000/api/v1/escrow/webhook-release',
  pspWebhookSecret: process.env.PSP_WEBHOOK_SECRET || 'whsec_smcta_test_secret_key_12345',
};
