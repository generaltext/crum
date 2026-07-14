# Crum

A clean, append-only CRM built as a [General Text](https://www.generaltext.org) app.
Track people, organizations, opportunities, and deals, with notes and conversations
attached to any of them, and a full who-did-what history for free.

Built against the app guide: https://www.generaltext.org/llms.txt
(local source: `projects/generaltext/content/docs/building-apps.md`). Design plan:
`planning/apps/crum/init.md` in the gt-meta repo.

## Develop

```bash
pnpm install
pnpm dev        # vite dev server; window.gt is injected in dev
pnpm test       # vitest — the event/reducer/log spine
pnpm typecheck
pnpm build      # tsc --noEmit && vite build → dist/ (gt.json at root, relative assets)
```

In dev, a tiny Vite plugin injects the public General Text runtime, so the app runs
standalone against a **local in-browser workspace** (IndexedDB + cross-tab sync). Open
two tabs to watch edits merge. No account, no server. To test inside real General Text,
`vite preview` and install by URL (Settings → Apps → Install by URL).

## Architecture: event-sourced

The source of truth is an **append-only event log**; the UI is a **materialized
projection** rebuilt by folding it. An append-only JSONL log is the structure that
merges cleanest under General Text's character-level CRDT, and it gives an audit trail
and full history for nothing. 

- **`lib/events.ts`** — the event envelope (`{ id, ts, actor, type, subject, data }`),
  one JSON line per change, `<entity>.<verb>`.
- **`lib/log.ts`** — monthly JSONL shards (`v0/events/YYYY-MM.jsonl`), safe appends,
  and incremental tail folding.
- **`lib/reducer.ts`** — folds events → records (entities, notes, comments, deal-stage
  history). Idempotent (dedupe by event id) so optimistic writes and re-folds are safe;
  fields resolve last-writer-wins.
- **`lib/cache.ts`** — a disposable IndexedDB materialization cache (hydrate instantly,
  re-parse only the new tail). The log is always the truth.
- **`lib/store.tsx`** — boots the runtime, subscribes shards, dispatches events (safe
  append based on freshest content), exposes `useStore()`.
- **`lib/model.ts`** — the entity/field registry (people, orgs, opportunities, deals)
  and pipeline config. Adding a field is one line; a new kind is one entry + a route.

Two design notes baked in from the plan review:

- **Unified conversation.** A **note** attaches to any entity and carries its own
  **comment thread**; all discussion is notes + comments (`components/NoteThread.tsx`).
- **Rich mentions everywhere.** Every text field uses `components/MentionInput.tsx`,
  an `@`-autocomplete editor that links entities, serialized to the portable token
  `@[Label](id)` (`lib/mentions.ts`) so links survive in plaintext.

## Files written (all under this app's `data/`)

- `v0/events/YYYY-MM.jsonl` — the append-only log (source of truth).
- `v0/config.json` — pipeline stages + tag palette.

Never edit a shard line in place; corrections are new events. That's what keeps merges
clean and the cache correct.
