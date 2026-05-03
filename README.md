# Circle

React and FastAPI roundtable app for composing expert discussions.

## Project Layout

```text
circle/
  frontend/   React + Vite app
  server/     FastAPI backend
  .github/   CI and dependency automation
```

## Setup

```bash
pnpm install
uv sync --project server
```

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` before running the backend.

## Run

```bash
pnpm api
pnpm dev
```

The frontend runs on `http://127.0.0.1:5173`. The backend runs on `http://127.0.0.1:8787` and exposes:

- `GET /api/health`
- `POST /api/roundtable/stream`

## Test

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:api
```

## Maintenance Priority

1. Keep the monorepo shape clear: app code lives in `frontend/`, backend code lives in `server/`, and root files coordinate tooling.
2. Keep CI green for frontend typecheck/test/build and backend pytest.
3. Keep dependency installs reproducible with `pnpm-lock.yaml` and `server/uv.lock`.
4. Let Dependabot open weekly dependency update PRs for pnpm, uv, and GitHub Actions.
5. Keep setup, run, test, and environment variable docs current.
6. Maintain repository metadata in GitHub: description, topics, homepage, and demo links.
7. Protect `main` with required PR review and passing CI.
8. Add collaboration files as the project grows: PR template, issue templates, changelog, license, and security policy.
