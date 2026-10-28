import { loadConfig } from '../config.js';
import { bootstrap } from '../bootstrap.js';

async function main(): Promise<void> {
  const { ctx, seed } = await bootstrap(loadConfig());
  console.log(JSON.stringify(seed, null, 2));
  await ctx.db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
