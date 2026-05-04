# AGENTS.md

## Verification

- For frontend UI/design changes, prefer using the Codex app browser or agent browser to inspect the running page after `build`/`test` pass.
- Use browser inspection for desktop/mobile viewport checks, visual overlap, basic click flows, and screenshots. Summarize only the verdict and important issues in the final response to keep token usage low.
- Use Playwright CLI screenshots when browser tooling is unavailable, when a reproducible artifact is needed, or when automated assertions are more useful than manual visual inspection.
