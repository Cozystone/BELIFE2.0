# BELIFE

BELIFE is a Korean-first, voice-first personal AI intelligence service. It turns casual conversation into structured memory, mental-state interpretation, a self ontology, a constrained digital twin, and an internal Human Connection preview.

## Stack

- Next.js App Router
- Clerk auth when configured, or BELIFE native auth on Neon when Clerk env vars are absent
- Neon Postgres + Drizzle, with in-memory demo mode when `DATABASE_URL` is absent
- Ollama-first AI runtime via `OLLAMA_BASE_URL`
- Structured Ollama JSON extraction for memory chunks, ontology candidates, behavior signals, and mental-state estimates, with deterministic fallback when Ollama is unavailable
- Profile enrichment approval flow through `GET/POST /api/profile/enrichment`
- Explicit consent memory import through `POST /api/memory/import`
- Explicit memory correction loop through `POST /api/memory/corrections`
- Today briefing evidence ledger linking interpretations back to memory, messages, and ontology signals
- Privacy Preferences through `GET/POST /api/privacy` for evidence visibility and private Human Connection previews
- Data Trust Center with score breakdown, interpretation guardrails, weakest signals, and next trust-gain actions
- Digital Twin responses are evidence-based and capped by a Data Trust gate
- Human Connection preview includes private scenario rehearsal through `POST /api/connection/simulate`
- Internal Human Connection candidate filtering through `GET /api/connection/candidates`
- Internal Human Connection incremental reranking through `GET /api/connection/reranking`
- CDCS-inspired Connection Quality Lens through `GET /api/connection/quality`
- Private pairwise relationship memory through `GET/POST /api/connection/relationship-memory`
- Mobile-centered UI with voice input through browser speech APIs

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

If Neon is not configured, the app runs in local demo mode. For production, set:

- `DATABASE_URL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL_CHAT`
- `OLLAMA_MODEL_EXTRACTOR`

See [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) for Vercel deployment, environment setup, database migration, and production health checks.

Production AI requires an externally reachable Ollama URL. `localhost`, `127.0.0.1`, and private LAN addresses will not work from Vercel Functions.

Clerk remains supported through:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

When Clerk is absent and `DATABASE_URL` exists, BELIFE native auth provides email/password signup with scrypt password hashing and hashed server-side session tokens.

## Database

```bash
npm run db:generate
npm run db:push
```

`db:push` loads `.env.local` with `dotenv-cli`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

GitHub Actions runs lint, typecheck, unit tests, and build on `main` pushes and pull requests.
Desktop E2E runs in CI only when the repository secret `BELIFE_CI_E2E_DATABASE_URL` points to a prepared Neon database.

BELIFE is a non-clinical self-understanding tool. It must not claim diagnosis, therapy, guaranteed outcomes, or deterministic relationship prediction.
