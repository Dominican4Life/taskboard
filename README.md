# Taskboard

A tiny full-stack task board — the "starter app" for the debug → run → ship loop.

- **Next.js 15** (App Router) + **TypeScript** + React 19
- REST API under `/api/tasks` (GET / POST / PATCH / DELETE)
- Tasks persist to `.data/tasks.json` (atomic writes, serialized mutations)

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production check:

```bash
npm run build && npm start
```

## API

| Method | Path | Body / query | Result |
| ------ | ---- | ------------ | ------ |
| GET | `/api/tasks` | – | `{ tasks: Task[] }` |
| POST | `/api/tasks` | `{ "title": "..." }` | `201 { task }` |
| PATCH | `/api/tasks` | `{ "id": "...", "done": true }` | `{ task }` |
| DELETE | `/api/tasks?id=...` | – | `{ ok: true }` |

`Task` = `{ id, title, done, createdAt }`.

## Notes

- `.data/*.json` is gitignored on purpose: runtime state is not source.
- Writes are serialized in-process and replaced atomically (temp file + rename),
  so concurrent requests can't clobber each other or leave a partial file.
- The JSON store assumes **one** app instance. On serverless/multi-instance hosts
  (e.g. Vercel) the filesystem is ephemeral and per-instance — swap `lib/store.ts`
  for Postgres or SQLite before deploying there.
- Swapping storage means replacing `lib/store.ts` only; the API and UI don't change.
