// Import Node.js Dependencies
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import { TimeStore } from "@openally/timestore";
import pino from "pino";
import type { LokiOptions } from "pino-loki";

// Import Internal Dependencies
import { buildServer } from "./server.js";
import { loadEnv } from "./modules/env.js";

// CONSTANTS
const env = loadEnv();

const store = new TimeStore({
  ttl: env.TOKEN_CACHE_MS,
  keepEventLoopAlive: false
});

const targets: any[] = [
  {
    target: "pino-pretty",
    options: {
      ignore: "pid,reqId"
    }
  }
];
if (env.SELF_MONITORING) {
  const lokiTransport = pino.transport<LokiOptions>({
    target: "pino-loki",
    options: {
      batching: true,
      interval: 5,
      host: env.LOKI_URL,
      // Note: allow custom configuration of labels (& others options?)
      labels: {
        app: "loki-reverse-proxy",
        host: env.SERVER_HOST ?? "localhost"
      }
    }
  });
  targets.push(lokiTransport);
}

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
      targets
    },
    level: "info"
  }
};

const server = buildServer(serverOptions, {
  grafanaApi: env.GRAFANA_URL,
  lokiApi: env.LOKI_URL,
  store
});

server.listen({
  port: env.SERVER_PORT,
  host: env.SERVER_HOST
}, function httpListeningCallback(err: Error, addr: string) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }

  server.log.info(`Server listening on ${addr}`);
});
