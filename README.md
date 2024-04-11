# loki-reverse-proxy
Reverse proxy for Loki API with proper Grafana API token authentication.

Under the hood it use Grafana `/api/auth/keys` API to validate the token and then dispatch the request to Loki. 

> [!CAUTION]
> When succesfully authenticated, by default tokens are cached for 5 minutes

## Getting started

```bash
$ git clone https://github.com/MyUnisoft/loki-reverse-proxy.git
$ cd loki-reverse-proxy
$ npm ci
$ npm run build
```

### Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a .env file (that file must be created at the root of the project).

```ini
GRAFANA_URL=""
LOKI_URL=""

SERVER_HOST=xxx.domain.com
SERVER_PORT=4000

# SSL/TLS Configuration
SERVER_SSL_ENABLED=false
SERVER_SSL_CERT=/absolute/path/to/file.crt
SERVER_SSL_KEY=/absolute/path/to/file.key

# Enable if behind a proxy like NGINX or Haproxy
TRUST_PROXY=false

# Automatically forward pino (logger) logs to LOKI_URL
SELF_MONITORING=false
```

### Let's go baby 🔥

```bash
$ npm start
```

## Env

Here is the full Zod schema for envs:

```js
const envSchema = z.object({
  GRAFANA_URL: z.string().url().trim(),
  LOKI_URL: z.string().url().trim(),
  TOKEN_CACHE_MS: z.coerce.number().optional().default(1_000 * 60 * 5),
  SERVER_PORT: z.coerce.number().optional().default(0),
  SERVER_HOST: z.string().optional(),
  SERVER_SSL_ENABLED: zBoolean("false"),
  SERVER_SSL_CERT: z.string().optional(),
  SERVER_SSL_KEY: z.string().optional(),
  TRUST_PROXY: zBoolean("false"),
  SELF_MONITORING: zBoolean("false")
});
```

Where zBoolean is defined as
```ts
function zBoolean(defaultValue?: "false" | "true") {
  const zEnum = z.enum(["true", "false"]).transform((value) => value === "true");

  return defaultValue ? zEnum.optional().default(defaultValue) : zEnum;
}
```

## API

### /health

Return proxy uptime

```json
{
  "uptime": 10
}
```

## Roadmap

- Find a way to also proxy Grafana API (currently that's not possible with the same root prefix).

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fraxken"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Thomas.G"/><br /><sub><b>Thomas.G</b></sub></a><br /><a href="https://github.com/MyUnisoft/loki-reverse-proxy/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/MyUnisoft/loki-reverse-proxy/issues?q=author%3Afraxken" title="Bug reports">🐛</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/MyUnisoft/loki-reverse-proxy/commits?author=fraxken" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/MyUnisoft/loki-reverse-proxy/pulls?q=is%3Apr+reviewed-by%3APierreDemailly" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
