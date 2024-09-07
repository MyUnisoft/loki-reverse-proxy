// Import Node.js Dependencies
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import { TimeStore } from "@openally/timestore";
import pino from "pino";

// Import Internal Dependencies
import { buildServer } from "./server.js";
import { loadEnv } from "./modules/env.js";

// CONSTANTS
const env = loadEnv();

const store = new TimeStore({
  ttl: env.TOKEN_CACHE_MS,
  keepEventLoopAlive: false
});

const targets: pino.TransportTargetOptions [] = [
  {
    target: "pino-pretty",
    options: {
      ignore: "pid,reqId"
    }
  }
];
if (env.SELF_MONITORING) {
  targets.push({
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
}

const serverOptions = {
  trustProxy: env.TRUST_PROXY,
  https: env.SERVER_SSL_ENABLED ?
    {
      key: readFileSync(env.SERVER_SSL_KEY!, "utf-8"),
      cert: readFileSync(env.SERVER_SSL_CERT!, "utf-8"),
      ca: typeof env.SERVER_SSL_CA === "string" ? readFileSync(env.SERVER_SSL_CA, "utf-8") : void 0
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
  port: env.SERVER_PORT!,
  host: env.SERVER_HOST!
}, function httpListeningCallback(err, addr) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }

  server.log.info(`Server listening on ${addr}`);
});
