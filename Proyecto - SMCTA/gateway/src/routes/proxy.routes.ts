import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../config';
import { AuthenticatedTenantRequest } from '../types';

/**
 * Proxy Inverso para derivar el tráfico al microservicio Backend Core (Rol 1).
 * Inyecta y asegura la propagación de la cabecera x-tenant-id.
 */
export const backendCoreProxy = createProxyMiddleware({
  target: config.coreBackendUrl,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      const authReq = req as AuthenticatedTenantRequest;
      if (authReq.tenant?.tenantId) {
        proxyReq.setHeader('x-tenant-id', authReq.tenant.tenantId);
      }
      fixRequestBody(proxyReq, req);
    },
    error: (err, _req, res) => {
      const response = res as any;
      if (response && typeof response.status === 'function' && !response.headersSent) {
        response.status(502).json({
          errorCode: 'BACKEND_CORE_UNAVAILABLE',
          message: 'El microservicio Backend Core (Rol 1) no está respondiendo en el endpoint configurado.',
          details: {
            target: config.coreBackendUrl,
            error: err.message,
          },
        });
      }
    },
  },
});
