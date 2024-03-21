// Import Third-party Dependencies
import z from "zod";

// CONSTANTS
const kEnvSchema = z.object({
  GRAFANA_URL: z.string().url().trim(),
  LOKI_URL: z.string().url().trim(),
  TOKEN_CACHE_MS: z.coerce.number().default(1_000 * 60 * 5),
  SERVER_PORT: z.coerce.number().default(0),
  SERVER_SSL_ENABLED: z.boolean().optional().default(false),
  SERVER_SSL_CERT: z.string().optional(),
  SERVER_SSL_KEY: z.string().optional(),
  TRUST_PROXY: z.boolean().default(false)
});

export function loadEnv(env = process.env) {
  return kEnvSchema.parse(env);
}
