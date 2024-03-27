// Import Third-party Dependencies
import { fastify, FastifyInstance } from "fastify";

export function createLokiServer(): FastifyInstance {
  const server = fastify({
    logger: {
      level: "silent"
    }
  });

  server.get("/services", async function endpoint() {
    return "hello world";
  });

  return server;
}

