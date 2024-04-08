// Import Node.js Dependencies
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import { TimeStore } from "@openally/timestore";

// Import Internal Dependencies
import { buildServer } from "./server.js";
import { loadEnv } from "./modules/env.js";

// CONSTANTS
const env = loadEnv();

const store = new TimeStore({
  ttl: env.TOKEN_CACHE_MS,
  keepEventLoopAlive: false
});

const serverOptions = {
  trustProxy: env.TRUST_PROXY,
  https: env.SERVER_SSL_ENABLED ?
    {
      key: readFileSync(env.SERVER_SSL_KEY!, "utf-8"),
      cert: readFileSync(env.SERVER_SSL_CERT!, "utf-8")
    } :
    null,
  disableRequestLogging: true,
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        ignore: "pid,reqId"
      }
    },
    level: "info"
  }
};

const server = buildServer(serverOptions, {
  grafanaApi: env.GRAFANA_URL,
  lokiApi: env.LOKI_URL,
  store
});

server.listen({ port: env.SERVER_PORT }, function httpListeningCallback(err: Error, addr: string) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }

  server.log.info(`Server listening on ${addr}`);
});
