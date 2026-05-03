# Roundtable Agent Backend

Python FastAPI backend for the streaming multi-agent roundtable.

## Setup

```bash
uv sync --project server
```

Keep API credentials in `.env` or `.env.local`; both are ignored by git.

## Run

```bash
pnpm api
```

The backend listens on `http://127.0.0.1:8787` and exposes:

- `GET /api/health`
- `POST /api/roundtable/stream`

## Test

```bash
pnpm test:api
```
