# Claude Compat Plugin

[English](README.md) | [한국어](docs/README.ko.md) | [简体中文](docs/README.zh-CN.md)

A root-level OpenCode plugin package that brings Claude-style compatibility features into OpenCode.

## Overview

This repository is now structured as an OpenCode plugin package.

- The actual implementation lives in `src/`
- The package entrypoint exports a default OpenCode plugin
- The reusable programmatic API is available from the `./compat` subpath

The current implementation focuses on the Claude compatibility layer that was extracted from `oh-my-openagent`:

- config schema, loading, and merge semantics
- Claude plugin discovery and component loading
- Claude command, skill, and agent loading
- runtime composition for `invokeSkill()` and `runTask()`
- OpenCode `config` hook integration for commands, agents, and MCP injection

## Project Layout

```text
.
├── src/
│   ├── agents/
│   ├── commands/
│   ├── config/
│   ├── plugin/
│   ├── plugins/
│   ├── runtime/
│   ├── skills/
│   ├── compat.ts
│   └── index.ts
├── docs/
│   ├── README.ko.md
│   └── README.zh-CN.md
├── package.json
└── tsconfig.json
```

## Requirements

- Node.js 22+ recommended
- npm 10+ recommended

## Installation

### From npm

Once published, install it with npm:

```bash
npm install @open-claude-code/opencode
```

### From source

Until you publish your own release, you can also install it from source:

```bash
git clone <your-repo-url>
cd feat-oh-my-opencode
npm install
npm run build
```

## Use In OpenCode

### Automated setup with bash

You can automate loader installation with the bundled script:

```bash
bash scripts/install-opencode-plugin.sh --global
```

For a project-local setup:

```bash
bash scripts/install-opencode-plugin.sh --project /path/to/project
```

If you already built the package, you can skip rebuilding:

```bash
bash scripts/install-opencode-plugin.sh --global --skip-build
```

### Global local plugin setup

OpenCode loads JavaScript and TypeScript plugin files from `~/.config/opencode/plugins/`.

The script above creates this loader file for you:

`~/.config/opencode/plugins/open-claude-code.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

This is the most practical global setup until the package is published.

### Project npm plugin setup

Once the package is published, you can install it in the same format as official plugins by editing the project-level `opencode.json`:

`opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@open-claude-code/opencode"]
}
```

OpenCode will download the package automatically when the project starts.

### Global npm plugin setup

After publishing, OpenCode can load the package directly from your global config:

`~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@open-claude-code/opencode"]
}
```

### Project-local plugin setup

You can also create a project-local loader file in `.opencode/plugins/`:

The script above can create it automatically with `--project`.

`.opencode/plugins/open-claude-code.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

## Use As A Library

The reusable runtime and loader APIs are exposed from the `compat` subpath:

```ts
import { createClaudeCompatRuntime } from "@open-claude-code/opencode/compat"

const runtime = await createClaudeCompatRuntime({
  directory: process.cwd(),
})

const instruction = runtime.invokeSkill("review", "focus on risky changes")
```

## Development

Run the main verification commands from the repository root:

```bash
npm run build
npm run typecheck
npm test
```

For release verification before publishing:

```bash
npm run release:check
```

## Publish

### Manual publish

```bash
npm publish --access public
```

### GitHub Actions auto publish

This repository includes a tag-based workflow that publishes to npm when you push a tag like `v0.1.0`.

Before using it:

- add the repository secret `NPM_TOKEN`
- make sure the tag version matches `package.json`
- review the package with `npm run release:check`

Example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

If you intend to publish this package publicly, replace `UNLICENSED` with the license you actually want to distribute under before the first release.

## Main API Surface

- plugin entry: `default export` from `src/index.ts`
- library entry: `@open-claude-code/opencode/compat`
- `loadClaudeCompatConfig()`
- `discoverClaudePlugins()`
- `loadAllPluginComponents()`
- `createClaudeCompatRuntime()`
- `createClaudeCompatConfigHandler()`

## Notes

- OpenCode plugin loading officially supports both config-based npm plugins and file-based local plugins.
- The package is now structured to be npm-publishable and `npm pack --dry-run` should be used before an actual publish.
- The current package already works as a local OpenCode plugin after `npm run build`.
- The package is intentionally minimal and does not include the full tmux or background-agent stack from `oh-my-openagent`.
