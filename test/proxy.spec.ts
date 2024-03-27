// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it, before, beforeEach, after } from "node:test";

// Import Third-party Dependencies
import { FastifyInstance } from "fastify";
import { MockAgent } from "undici";

// Import Internal Dependencies
import { buildServer } from "../src/server.js";
import { createLokiServer } from "./mocks/loki.js";
import { createTimestore } from "./mocks/timestore.js";
import * as utils from "./utils.js";

// CONSTANTS
const kDummyGrafanaURL = "https://foobar.com";

const grafanaAgent = new MockAgent();
grafanaAgent.disableNetConnect();

describe("proxy", () => {
  // VARS
  const store = createTimestore();
  let lokiServer: FastifyInstance;
  let proxyServer: FastifyInstance;

  before(async() => {
    lokiServer = createLokiServer();
    const lokiApi = await lokiServer.listen({ port: 0 });

    proxyServer = buildServer(
      { logger: { level: "silent" } },
      {
        store: store as any,
        grafanaApi: kDummyGrafanaURL,
        grafanaAgent,
        lokiApi
      }
    );
    await proxyServer.ready();
  });

  beforeEach(() => {
    store.reset();
  });

  after(async() => {
    await Promise.allSettled(
      [proxyServer, lokiServer].map((srv) => srv.close())
    );
  });

  const interceptor = grafanaAgent.get(kDummyGrafanaURL);

  it("should return 401 with a Unauthorized message because Authorization header do not begin with Bearer", async() => {
    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization: "not good"
      }
    });

    assert.strictEqual(response.statusCode, 401);
    const body = await response.json();
    assert.strictEqual(body.message, "Unauthorized");
  });

  it(`should authenticate request using mocked Grafana API and
  then dispatch it through the proxy and return the Loki server response`, async() => {
    const { authorization, token } = utils.generateBearer();

    interceptor
      .intercept({
        headers: {
          authorization
        },
        path: (path) => path.includes("api/auth/keys")
      })
      .reply(200, {}, {
        headers: { "Content-Type": "application/json" }
      });

    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, "hello world");

    assert.strictEqual(store.has.mock.callCount(), 1);
    assert.strictEqual(store.add.mock.callCount(), 1);
    assert.deepEqual(store.add.mock.calls[0].arguments, [
      token
    ]);
    assert.strictEqual(store.delete.mock.callCount(), 0);
  });

  it(`should authenticate request using token cache and then
  then dispatch it through the proxy and return the Loki server response`, async() => {
    const { authorization, token } = utils.generateBearer();
    store.has.mock.mockImplementationOnce(() => true);

    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, "hello world");

    assert.strictEqual(store.has.mock.callCount(), 1);
    assert.deepEqual(store.has.mock.calls[0].arguments, [
      token
    ]);
  });

  it("should fail Grafana authentication and then return the grafana API message", async() => {
    const { authorization } = utils.generateBearer();
    const expectedMessage = "try again babe!";

    interceptor
      .intercept({
        headers: {
          authorization
        },
        path: (path) => path.includes("api/auth/keys")
      })
      .reply(401, { message: expectedMessage }, {
        headers: { "Content-Type": "application/json" }
      });

    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization
      }
    });

    assert.strictEqual(response.statusCode, 401);
    const body = await response.json();
    assert.strictEqual(body.message, expectedMessage);

    assert.strictEqual(store.has.mock.callCount(), 1);
    assert.strictEqual(store.delete.mock.callCount(), 0);
    assert.strictEqual(store.add.mock.callCount(), 0);
  });

  it("should fail authentication and return default message 'invalid API key' if none is detected", async() => {
    const { authorization } = utils.generateBearer();

    interceptor
      .intercept({
        headers: {
          authorization
        },
        path: (path) => path.includes("api/auth/keys")
      })
      .reply(401, {}, {
        headers: { "Content-Type": "application/json" }
      });

    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization
      }
    });

    assert.strictEqual(response.statusCode, 401);
    const body = await response.json();
    assert.strictEqual(body.message, "invalid API key");

    assert.strictEqual(store.has.mock.callCount(), 1);
    assert.strictEqual(store.delete.mock.callCount(), 0);
    assert.strictEqual(store.add.mock.callCount(), 0);
  });

  it("should fail authentication and return default message 'invalid API key' if response is not a JSON", async() => {
    const { authorization, token } = utils.generateBearer();

    interceptor
      .intercept({
        headers: {
          authorization
        },
        path: (path) => path.includes("api/auth/keys")
      })
      .reply(401, "foobar", {
        headers: { "Content-Type": "plain/text" }
      });

    const response = await proxyServer.inject({
      method: "GET",
      url: "/services",
      headers: {
        authorization
      }
    });

    assert.strictEqual(response.statusCode, 401);
    const body = await response.json();
    assert.strictEqual(body.message, "invalid API key");

    assert.strictEqual(store.has.mock.callCount(), 1);
    assert.strictEqual(store.delete.mock.callCount(), 1);
    assert.deepEqual(store.delete.mock.calls[0].arguments, [
      token
    ]);
    assert.strictEqual(store.add.mock.callCount(), 0);
  });
});
