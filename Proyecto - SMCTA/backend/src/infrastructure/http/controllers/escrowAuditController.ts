import { Request, Response, NextFunction } from 'express';
import { LedgerRepository } from '../../database/ledgerRepository.js';
import Decimal from 'decimal.js';

export class EscrowAuditController {
  public static async getTenantAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await LedgerRepository.getEntriesByTenant(req.tenant.tenantId);

      let totalCustodyFlow = new Decimal(0);
      let totalTenantFeeAccumulated = new Decimal(0);

      for (const entry of entries) {
        totalCustodyFlow = totalCustodyFlow.plus(new Decimal(entry.amountInEscrow));
        totalTenantFeeAccumulated = totalTenantFeeAccumulated.plus(new Decimal(entry.tenantFeeAccumulated));
      }

      return res.status(200).json({
        tenantId: req.tenant.tenantId,
        companyName: req.tenant.companyName,
        totalEntries: entries.length,
        summary: {
          totalCustodyFlow: totalCustodyFlow.toNumber(),
          totalTenantFeeAccumulated: totalTenantFeeAccumulated.toNumber()
        },
        ledgerEntries: entries
      });
    } catch (error) {
      next(error);
    }
  }
}
