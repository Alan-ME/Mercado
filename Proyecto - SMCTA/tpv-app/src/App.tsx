import React, { useState } from 'react';
import { TPVHeader } from './components/TPVHeader';
import { QRScanner } from './components/QRScanner';
import { ValidationModal } from './components/ValidationModal';
import { RedemptionLog } from './components/RedemptionLog';
import { RedemptionResult, RedemptionLogEntry } from './types';
import { tpvService } from './services/tpv.service';
import { soundService } from './services/sound.service';

export const App: React.FC = () => {
  const [tenantId, setTenantId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<RedemptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<RedemptionLogEntry[]>([]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setSoundEnabled(next);
  };

  const handleScanResult = async (rawContent: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await tpvService.validateAndRedeem(rawContent, tenantId);
      setValidationResult(result);

      // Registrar en el log de sesión
      const logEntry: RedemptionLogEntry = {
        id: `log_${Date.now()}`,
        couponId: result.couponId || 'N/A',
        tenantName: tenantId === '11111111-1111-1111-1111-111111111111' ? 'Festival Vibe' : 'Grand Hotel',
        status: result.status,
        success: result.success,
        amount: result.amountReleased || 0,
        timestamp: result.timestamp,
        message: result.message,
      };

      setLogs((prev) => [logEntry, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tpv-container">
      <TPVHeader
        currentTenantId={tenantId}
        onTenantChange={setTenantId}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <QRScanner
        currentTenantId={tenantId}
        onScanResult={handleScanResult}
        isProcessing={isProcessing}
      />

      <RedemptionLog
        logs={logs}
        onClear={() => setLogs([])}
      />

      <ValidationModal
        result={validationResult}
        onClose={() => setValidationResult(null)}
      />
    </div>
  );
};

export default App;
