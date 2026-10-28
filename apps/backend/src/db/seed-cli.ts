import { loadConfig } from '../config.js';
import { bootstrap } from '../bootstrap.js';

/** CLI de siembra manual (`npm run seed`). Útil contra un Postgres en red. */
async function main(): Promise<void> {
  const { ctx, seed } = await bootstrap(loadConfig());
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(seed, null, 2));
  await ctx.db.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
