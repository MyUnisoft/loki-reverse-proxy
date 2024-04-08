// Import Third-party Dependencies
import z from "zod";

// CONSTANTS
const envSchema = z.object({
  GRAFANA_URL: z.string().url().trim(),
  LOKI_URL: z.string().url().trim(),
  TOKEN_CACHE_MS: z.coerce.number().optional().default(1_000 * 60 * 5),
  SERVER_PORT: z.coerce.number().optional().default(0),
  SERVER_HOST: z.string().optional(),
  SERVER_SSL_ENABLED: z.coerce.boolean().optional().default(false),
  SERVER_SSL_CERT: z.string().optional(),
  SERVER_SSL_KEY: z.string().optional(),
  TRUST_PROXY: z.coerce.boolean().optional().default(false),
  SELF_MONITORING: z.coerce.boolean().optional().default(false)
});

export type ENV = z.infer<typeof envSchema>;

export function loadEnv(
  env = process.env
): ENV {
  return envSchema.parse(env);
}
