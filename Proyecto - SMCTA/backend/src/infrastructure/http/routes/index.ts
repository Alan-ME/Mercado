import { Router } from 'express';
import { tenantMiddleware } from '../middlewares/tenantMiddleware.js';
import { CheckoutController } from '../controllers/checkoutController.js';
import { WalletController } from '../controllers/walletController.js';
import { OrderController } from '../controllers/orderController.js';
import { TPVController } from '../controllers/tpvController.js';
import { EscrowAuditController } from '../controllers/escrowAuditController.js';

export const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'smcta-backend-core', timestamp: new Date().toISOString() });
});

router.use(tenantMiddleware);

router.get('/api/v1/tenant/config', (req, res) => {
  res.status(200).json({
    tenantId: req.tenant.tenantId,
    companyName: req.tenant.companyName,
    subdomain: req.tenant.subdomain,
    sellerTakeRatePct: Number(req.tenant.sellerTakeRatePct),
    buyerTakeRatePct: Number(req.tenant.buyerTakeRatePct),
    priceFloorPct: Number(req.tenant.priceFloorPct),
    priceCeilingPct: Number(req.tenant.priceCeilingPct),
    maxDailyResalesPerUser: req.tenant.maxDailyResalesPerUser,
    closureHoursBeforeEvent: req.tenant.closureHoursBeforeEvent,
    platformRevenueSharePct: Number(req.tenant.platformRevenueSharePct),
    theme: req.tenant.themeConfig || {}
  });
});

router.post('/api/v1/checkout/primary', CheckoutController.checkoutPrimary);
router.get('/api/v1/coupons/my-wallet', WalletController.getMyWallet);
router.get('/api/v1/coupons/:id/qr-token', WalletController.getQRToken);
router.post('/api/v1/p2p/orders', OrderController.publishOrder);
router.get('/api/v1/p2p/orders', OrderController.listOpenOrders);
router.post('/api/v1/p2p/orders/:id/buy', OrderController.buyOrder);
router.post('/api/v1/tpv/validate-qr', TPVController.validateQR);
router.get('/api/v1/escrow/audit', EscrowAuditController.getTenantAudit);
