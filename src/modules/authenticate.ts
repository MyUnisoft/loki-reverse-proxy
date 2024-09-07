// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import type { AuthenticationContext } from "../context.js";

// CONSTANTS
const kBearerPrefix = "Bearer ";
const kGrafanaInvalidApiKey = "invalid API key";

export type AuthenticateResult =
  { error: true; message: string; } |
  { error: false; };

export async function authenticate(
  authorization: string,
  ctx: AuthenticationContext
): Promise<AuthenticateResult> {
  if (!authorization.startsWith(kBearerPrefix)) {
    return { error: true, message: "Unauthorized" };
  }

  const token = authorization.slice(kBearerPrefix.length);
  if (ctx.store.has(token)) {
    return { error: false };
  }

  try {
    const uri = new URL("api/auth/keys", ctx.grafanaApi);

    const httpResponse = await undici.request(uri, {
      method: "GET",
      dispatcher: ctx.grafanaAgent,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    if (httpResponse.statusCode === 200) {
      ctx.store.add(token);

      return { error: false };
    }

    const data = await httpResponse.body.json() as {
      message: string;
    };

    return {
      error: true,
      message: data.message ?? kGrafanaInvalidApiKey
    };
  }
  catch (error: any) {
    ctx.store.delete(token);
    ctx.logger.error(error.toString());

    return { error: true, message: kGrafanaInvalidApiKey };
  }
}
