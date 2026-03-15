# Project Overview
- Name: @open-claude-code/opencode
- Purpose: OpenCode plugin package that adds Claude-style compatibility features, including config loading/merging, plugin discovery, and command/skill/agent/MCP integration.
- Tech stack: TypeScript, Node.js 22+, npm 10+, @opencode-ai/plugin, zod, jsonc-parser, js-yaml.
- Entry points: `src/index.ts` exports the default OpenCode plugin; `src/compat.ts` exposes the reusable library API.
- Main directories: `src/` implementation, `docs/` translated READMEs, `scripts/` helper installer, `.opencode/skills/` project-specific skills.
- Distribution: npm-publishable package with `dist/`, `README.md`, `docs/`, and `scripts/` included via `package.json` `files`.
