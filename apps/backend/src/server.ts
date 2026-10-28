import { loadConfig } from './config.js';
import { bootstrap } from './bootstrap.js';
import { buildApp } from './app.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const { ctx, seed } = await bootstrap(config);
  const app = await buildApp(ctx, config);

  await app.listen({ port: config.port, host: config.host });

  const url = `http://localhost:${config.port}`;
  // Banner de arranque (stdout) — pensado para la consola de Debug de VS Code.
  const lines: string[] = [
    '',
    '  ┌───────────────────────────────────────────────────────────────┐',
    '  │  SMCTA P2P v2 — Backend Core + Frontend White-Label            │',
    '  └───────────────────────────────────────────────────────────────┘',
    `  ▶ App / API:     ${url}`,
    `  ▶ Health:        ${url}/health`,
    `  ▶ Motor de datos: ${config.databaseUrl ? 'PostgreSQL (red)' : 'PostgreSQL embebido (PGlite)'}`,
    `  ▶ Locks:          ${config.redisUrl ? 'Redis' : 'en proceso'}`,
    '',
    '  Tenants demo (elegí uno en la UI o enviá header x-tenant-id):',
  ];
  for (const t of seed.tenants) {
    lines.push(`   • ${t.companyName}  [subdominio: ${t.subdomain}]`);
    for (const u of t.users) {
      lines.push(`       - ${u.displayName}  (userId: ${u.userId})`);
    }
  }
  lines.push('');
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Recibido ${signal}, cerrando...`);
    await app.close();
    await ctx.db.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fallo al iniciar el servidor:', err);
  process.exit(1);
});
