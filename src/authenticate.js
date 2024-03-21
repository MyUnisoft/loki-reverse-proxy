// Import Third-party Dependencies
import * as undici from "undici";

// CONSTANTS
const kBearerPrefix = "Bearer ";
const kGrafanaInvalidApiKey = "invalid API key";

/**
 * @param {!string} authorization
 */
export async function authenticate(
  authorization,
  ctx
) {
  if (!authorization.startsWith(kBearerPrefix)) {
    return { error: true, message: "Unauthorized" };
  }

  const token = authorization.slice(kBearerPrefix.length);
  if (ctx.store.has(token)) {
    return { error: false };
  }

  try {
    const uri = new URL("/api/auth/keys", ctx.grafanaApi);

    const httpResponse = await undici.request(uri, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    if (httpResponse.statusCode === 200) {
      ctx.store.add(token);

      return { error: false };
    }

    const data = await httpResponse.body.json();

    return {
      error: true,
      message: data.message ?? kGrafanaInvalidApiKey
    };
  }
  catch (error) {
    ctx.store.delete(token);
    ctx.log.error(error.toString());

    return { error: true, message: kGrafanaInvalidApiKey };
  }
}
