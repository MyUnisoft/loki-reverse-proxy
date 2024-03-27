// Import Third-party Dependencies
import { FastifyBaseLogger } from "fastify";
import { TimeStore } from "@openally/timestore";
import { Agent, Dispatcher, MockAgent } from "undici";

export interface ServerContext {
  store: TimeStore;
  lokiApi: string;
  grafanaApi: string;
  grafanaAgent?: Agent | MockAgent | Dispatcher;
}

export type AuthenticationContext = ServerContext & {
  logger: FastifyBaseLogger;
};
