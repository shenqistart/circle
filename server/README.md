# Roundtable Agent Backend

Python FastAPI backend for the streaming multi-agent roundtable.

## Setup

```bash
python3 -m venv /tmp/circle-agent-backend-venv
/tmp/circle-agent-backend-venv/bin/python -m pip install -e server
```

Keep API credentials in `.env` or `.env.local`; both are ignored by git.

## Run

```bash
source /tmp/circle-agent-backend-venv/bin/activate
pnpm api
```

The backend listens on `http://127.0.0.1:8787` and exposes:

- `GET /api/health`
- `POST /api/roundtable/stream`

## Test

```bash
/tmp/circle-agent-backend-venv/bin/python -m pytest server/tests
```
