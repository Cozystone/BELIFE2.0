# BELIFE

BELIFE is a Korean-first, voice-first personal AI intelligence service. It turns casual conversation into structured memory, mental-state interpretation, a self ontology, a constrained digital twin, and an internal Human Connection preview.

## Stack

- Next.js App Router
- Clerk auth, with demo mode when Clerk env vars are absent
- Neon Postgres + Drizzle, with in-memory demo mode when `DATABASE_URL` is absent
- Ollama-first AI runtime via `OLLAMA_BASE_URL`
- Mobile-centered UI with voice input through browser speech APIs

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

If Clerk and Neon are not configured, the app runs in demo mode. For production, set:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL_CHAT`
- `OLLAMA_MODEL_EXTRACTOR`

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

BELIFE is a non-clinical self-understanding tool. It must not claim diagnosis, therapy, guaranteed outcomes, or deterministic relationship prediction.
