/**
 * Entry point. Wires the listener + Fastify server together.
 */
import { buildServer } from "./api.js";
import { getConfig } from "./config.js";
import { runMigrations } from "./db/client.js";
import { startListener } from "./listener.js";

async function main() {
  const cfg = getConfig();

  await runMigrations();

  const app = buildServer();
  const listener = startListener(app.log);
  listener.start();

  const close = async () => {
    app.log.info("shutting down");
    listener.close();
    await app.close();
  };
  process.on("SIGTERM", close);
  process.on("SIGINT", close);

  await app.listen({ host: cfg.INDEXER_HOST, port: cfg.INDEXER_PORT });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
