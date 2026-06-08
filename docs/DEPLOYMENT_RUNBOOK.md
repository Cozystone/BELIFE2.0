# BELIFE Deployment Runbook

This runbook is for taking BELIFE from local development to a production-ready Vercel deployment.

## 1. Tooling

Install the Vercel CLI when it is not already available:

```bash
npm i -g vercel
vercel --version
```

The CLI is used for environment sync, deploys, inspections, and log checks.

## 2. Required Production Services

BELIFE production readiness requires:

- Neon Postgres through `DATABASE_URL`
- Clerk credentials, or BELIFE native auth backed by Neon
- An externally reachable Ollama endpoint through `OLLAMA_BASE_URL`

`OLLAMA_BASE_URL` cannot be `localhost`, `127.0.0.1`, or a private LAN address on Vercel. It must be reachable from Vercel Functions and expose the Ollama HTTP API, including `GET /api/tags` and `POST /api/generate`.

## 3. Vercel Environment Variables

Set production variables in Vercel:

```bash
vercel env add DATABASE_URL production
vercel env add OLLAMA_BASE_URL production
vercel env add OLLAMA_MODEL_CHAT production
vercel env add OLLAMA_MODEL_EXTRACTOR production
vercel env add OLLAMA_TIMEOUT_MS production
```

If the Ollama endpoint requires a bearer token:

```bash
vercel env add OLLAMA_API_KEY production
```

Recommended model defaults:

```text
OLLAMA_MODEL_CHAT=dolphin3:latest
OLLAMA_MODEL_EXTRACTOR=dolphin3:latest
OLLAMA_TIMEOUT_MS=18000
```

### Temporary authenticated local Ollama tunnel

If BELIFE needs to use a local Ollama server before a durable hosted Ollama endpoint is ready, do not expose Ollama directly. Run the BELIFE auth proxy, tunnel that proxy, and set the same bearer token in Vercel:

```bash
# terminal 1
$env:OLLAMA_PROXY_TOKEN="<long-random-token>"
npm run ollama:proxy

# terminal 2
cloudflared tunnel --url http://127.0.0.1:41134
```

Then set:

```bash
vercel env add OLLAMA_BASE_URL production
vercel env add OLLAMA_API_KEY production
```

Use the `https://*.trycloudflare.com` URL from cloudflared as `OLLAMA_BASE_URL`, and the same token as `OLLAMA_API_KEY`.

This quick tunnel is useful for validation only. For durable production AI, use a stable externally reachable Ollama endpoint or a named Cloudflare Tunnel/service with the same bearer-token proxy in front of Ollama.

## 4. Database Migration

After pulling local env vars:

```bash
vercel env pull .env.local
npm run db:push
```

## 5. Verification

Run local gates before deploying:

```bash
npm run verify
npm run test:e2e
```

Deploy and inspect production:

```bash
vercel deploy --prod --yes
vercel inspect https://belife2.vercel.app
vercel logs https://belife2.vercel.app --since 1h --level error --no-follow
```

Production health endpoints:

```bash
curl https://belife2.vercel.app/api/health/readiness
curl https://belife2.vercel.app/api/health/ai
```

`/api/health/readiness` is only `ready` when required services are configured and the Ollama health check can reach the external endpoint.
`/api/health/ai` returns the current runtime mode (`live` or `fallback`), configured models, endpoint, timeout, and required/optional Ollama environment variables. The same runtime diagnostics are visible in Settings under AI Runtime.
