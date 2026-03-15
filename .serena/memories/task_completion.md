# Task Completion Checklist
- For code or packaging changes, run `npm run build`, `npm run typecheck`, and `npm test`.
- For publish/setup related changes, also run `npm pack --dry-run` to verify package contents.
- If installer or docs behavior changes, update the matching sections in `README.md` and translated docs under `docs/`.
- Avoid destructive git operations; this repo may contain unrelated user changes.
