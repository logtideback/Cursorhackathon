# Scout AI

**Understand every match in seconds.**

Scout AI is a mobile-first AI football match companion that turns live, cryptographically verifiable structured football data into simple real-time explanations for fans, journalists, and creators.

> Hackathon MVP — premium sports intelligence product, not a generic AI dashboard.

## Hackathon pitch

Live football data is dense. Scout AI makes it instantly legible:

- Scan live, upcoming, and finished matches
- Open a match for a Scout Briefing, momentum, key events, and stats
- Ask Scout natural questions with instant, local answers
- Create a shareable recap in one tap

Insights are generated from **structured match data** — not video analysis, and with no betting or gambling features.

## Features

- **Matches home** — Live status, filter tabs, polished match cards
- **Match detail** — Scoreboard, momentum, briefing, events, stats
- **Ask Scout** — Rule-based chat with suggested questions and typed fallbacks
- **Shareable recap** — Compact summary with clipboard copy
- **Saved matches** — Save/unsave via `localStorage`
- **Service abstraction** — Mock data today, TxLINE-ready tomorrow

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide icons
- npm

No auth, payments, databases, or smart contracts.

## Architecture

```
src/
  app/                  # Routes: /, /match/[id], /scout, /saved
  components/           # Reusable UI (MatchCard, ScoutChat, …)
  data/mock-matches.ts  # Demo fixtures
  hooks/                # Client hooks (saved matches)
  lib/                  # Recap + Scout response utilities
  services/             # FootballDataService + mock + TxLINE placeholder
  types/football.ts     # Shared domain types
```

The UI consumes `getFootballService()` rather than importing mock data directly. Swapping providers later should not require rewriting screens.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Environment variables

Optional — the app works with **no** environment variables using mock data.

| Variable | Purpose |
|---|---|
| `TXLINE_API_URL` | Base URL for TxLINE API (future) |
| `TXLINE_API_KEY` | API key for TxLINE (future) |
| `OPENAI_API_KEY` | Optional richer Ask Scout answers (future) |

Copy `.env.example` to `.env.local` when ready.

## TxLINE integration path

1. Keep the shared `Match` types in `src/types/football.ts`
2. Implement requests in `src/services/txline-football-service.ts`
3. Complete `mapTxlineMatch()` field mapping from TxLINE payloads
4. Switch `getFootballService()` in `src/services/index.ts` to return TxLINE when credentials exist
5. Optionally fall back to mock data on API failure for demos

Until mapping is complete, the app always serves mock fixtures so the product works immediately.

## Deployment

Any Node host that supports Next.js works (Vercel recommended):

```bash
npm run build
npm start
```

Or connect the repo to Vercel / Netlify / similar and deploy the default Next.js build.

No secrets are required for the MVP demo.

## Known MVP limitations

- Match data is mocked (three sample fixtures)
- Ask Scout uses a local rule-based generator, not a live LLM
- TxLINE service is a typed placeholder with TODOs
- Saved matches are device-local only (`localStorage`)
- No real-time websocket updates
- No user accounts or cross-device sync

## License

Private hackathon MVP.
