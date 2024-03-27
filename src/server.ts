// Import Node.js Dependencies
import http from "node:http";
import https from "node:https";

// Import Third-party Dependencies
import fastify, { FastifyHttpOptions, FastifyHttpsOptions, FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";
import { getGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { authenticate } from "./modules/authenticate.js";
import { ServerContext } from "./context.js";

export function buildServer(
  options: FastifyHttpOptions<http.Server> | FastifyHttpsOptions<https.Server>,
  context: ServerContext
): FastifyInstance {
  context.grafanaAgent ??= getGlobalDispatcher();

  const server = fastify(options);
  server.log.info(`LOKI_URL: ${context.lokiApi}`);
  server.log.info(`GRAFANA_URL: ${context.grafanaApi}`);

  server.addHook("onRequest", async(request) => {
    if (request.method !== "OPTIONS") {
      request.log.info(`(${request.id}) receiving request "${request.method} ${request.raw.url}"`);
    }
  });

  server.addHook("onResponse", async(request, reply) => {
    if (request.method !== "OPTIONS") {
      request.log.info(
        `response returned "${request.method} ${request.raw.url}",`
          + ` statusCode: ${reply.raw.statusCode} (${reply.elapsedTime.toFixed(3)}ms)`
      );
    }
  });

  server.register(proxy, {
    upstream: context.lokiApi,
    http2: false,
    async preHandler(request, reply) {
      const { authorization = "" } = request.headers;

      const result = await authenticate(authorization, {
        logger: request.server.log, ...context
      });
      if (result.error) {
        reply.status(401).send({
          message: result.message
        });
      }
    }
  });

  server.get("/health", async() => {
    return {
      uptime: process.uptime()
    };
  });

  return server;
}
