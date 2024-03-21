// Import Third-party Dependencies
import fastify from "fastify";
import proxy from "@fastify/http-proxy";
import { TimeStore } from "@openally/timestore";

// Import Internal Dependencies
import { authenticate } from "./authenticate.js";
import { loadEnv } from "./env.js";

const env = loadEnv();

const store = new TimeStore({
  ttl: env.TOKEN_CACHE_MS,
  keepEventLoopAlive: false
});

const server = fastify({
  trustProxy: env.TRUST_PROXY,
  https: env.SERVER_SSL_ENABLED ?
    { key: env.SERVER_SSL_KEY, cert: env.SERVER_SSL_CERT } :
    void 0,
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
});
server.log.info(`LOKI_URL: ${env.LOKI_URL}`);
server.log.info(`GRAFANA_URL: ${env.GRAFANA_URL}`);
server.log.info(`SSL: ${env.SERVER_SSL_ENABLED}`);

server.addHook("onRequest", async(request) => {
  if (request.method !== "OPTIONS") {
    request.log.info(`(${request.id}) receiving request "${request.method} ${request.raw.url}"`);
  }
});

server.addHook("onResponse", async(request, reply) => {
  if (request.method !== "OPTIONS") {
    request.log.info(
      `response returned "${request.method} ${request.raw.url}",`
        + ` statusCode: ${reply.raw.statusCode} (${reply.elapsedTime().toFixed(3)}ms)`
    );
  }
});

server.register(proxy, {
  upstream: env.LOKI_URL,
  http2: false,
  async preHandler(request, reply) {
    const { authorization = "" } = request.headers;

    const { error, message } = await authenticate(authorization, {
      log: request.log,
      store,
      grafanaApi: env.GRAFANA_URL
    });
    error && reply.status(401).send({
      message
    });
  }
});

server.get("/health", async() => {
  return {
    uptime: process.uptime()
  };
});

server.listen({ port: env.SERVER_PORT });
