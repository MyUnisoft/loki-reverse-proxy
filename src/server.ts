// Import Third-party Dependencies
import fastify, { type FastifyServerOptions, type FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";
import { UAParser } from "ua-parser-js";
import { getGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { authenticate } from "./modules/authenticate.js";
import type { ServerContext } from "./context.js";

export function buildServer(
  options: FastifyServerOptions,
  context: ServerContext
): FastifyInstance {
  context.grafanaAgent ??= getGlobalDispatcher();

  const server = fastify(options);
  server.log.info(`LOKI_URL: ${context.lokiApi}`);
  server.log.info(`GRAFANA_URL: ${context.grafanaApi}`);

  server.addHook("onRequest", async(request) => {
    const userAgent = new UAParser(request.headers["user-agent"])
      .getResult();

    if (request.method !== "OPTIONS") {
      const uaLog = formatUserAgentLog(userAgent);

      request.log.info(`(${request.id}|${uaLog}) receiving request "${request.method} ${request.raw.url}"`);
    }
  });

  server.addHook("onResponse", async(request, reply) => {
    if (request.method !== "OPTIONS") {
      request.log.info(
        `(${request.id}) response returned "${request.method} ${request.raw.url}",`
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

function formatUserAgentLog(parsedUserAgent: UAParser.IResult): string {
  const { browser: uaBrowser, os: uaOs } = parsedUserAgent;

  return (uaBrowser.name && uaOs.name) ? `${uaOs.name}/${uaBrowser.name}` : parsedUserAgent.ua;
}
