This is the Next.js frontend for AWS Builders – UST recruitment.

## Getting Started

From the repo root (not `frontend/`):

```bash
pnpm db:up && pnpm db:push && pnpm db:seed
pnpm dev
```

That starts Postgres, the Hono API on [http://localhost:8787](http://localhost:8787), and this app on [http://localhost:3000](http://localhost:3000).

Copy `NEXT_PUBLIC_API_URL` from the repo `.env.example` into `frontend/.env.local` if you don't already have it. Next only reads env from this folder.

`/admin/hr` should list Ana Cruz, Ben Santos, Carla Mendoza, and Dario Aquino from the seed. If you see Lyka/Carl instead, the UI is still on mocks. Open a row: the "Why do you want to join…" block should be a paragraph from seed, not —. If it's missing, `pnpm db:push && pnpm db:seed` (the answer lives on `applications.motivation`).

The careers/positions browser at `/apply/positions` still uses local mock data — that API payload doesn't have offices or duties yet.
