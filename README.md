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
```

### Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a .env file (that file must be created at the root of the project).

```ini
GRAFANA_URL=""
LOKI_URL=""
SERVER_PORT=3000
```

### Let's go baby 🔥

```bash
$ npm start
```

## Env

Here is the full Zod schema for envs:

```js
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
[![All Contributors](https://img.shields.io/badge/all_contributors-7-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->


<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
