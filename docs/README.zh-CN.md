# Claude Compat Plugin

[English](../README.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

这是一个用于把 Claude 风格兼容能力接入 OpenCode 的根级 OpenCode plugin 包。

## 概览

这个仓库现在已经按 OpenCode plugin 包的结构组织。

- 实际实现位于 `src/`
- 包入口导出一个 OpenCode plugin 的 default export
- 可复用的编程 API 通过 `./compat` 子路径暴露

当前实现聚焦于从 `oh-my-openagent` 提取出来的 Claude 兼容层。

- config schema、加载与 merge 语义
- Claude plugin 发现与组件加载
- Claude command、skill、agent 加载
- 用于 `invokeSkill()` 和 `runTask()` 的 runtime 组合
- 通过 OpenCode `config` hook 注入 commands、agents 与 MCP

## 项目结构

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

## 环境要求

- 推荐 Node.js 22+
- 推荐 npm 10+

## 安装方式

### 从 npm 安装

在包发布之后，可以直接这样安装：

```bash
npm install @open-claude-code/opencode
```

### 从源码安装

在你自己正式发布之前，也可以直接从源码安装使用。

```bash
git clone <your-repo-url>
cd feat-oh-my-opencode
npm install
npm run build
```

## 在 OpenCode 中使用

### 使用 bash 脚本自动安装

你可以用仓库内置脚本自动安装 loader。

```bash
bash scripts/install-opencode-plugin.sh --global
```

如果想做项目级安装，可以这样执行：

```bash
bash scripts/install-opencode-plugin.sh --project /path/to/project
```

如果已经构建过，也可以跳过 build：

```bash
bash scripts/install-opencode-plugin.sh --global --skip-build
```

### 全局 local plugin 设置

OpenCode 会从 `~/.config/opencode/plugins/` 加载 JavaScript/TypeScript plugin 文件。

执行上面的脚本后，会自动生成下面这个 loader 文件。

`~/.config/opencode/plugins/open-claude-code.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

在当前还未发布 npm 包的情况下，这是最现实的全局使用方式。

### 项目级 npm plugin 配置

包发布后，也可以像官方插件一样，直接在项目根目录的 `opencode.json` 里声明：

`opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@open-claude-code/opencode"]
}
```

这样 OpenCode 在项目启动时会自动下载这个包。

### 全局 npm plugin 设置

等后续发布到 npm 后，可以直接通过 OpenCode 全局配置加载。

`~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@open-claude-code/opencode"]
}
```

### 项目 local plugin 设置

如果只想在单个项目里使用，也可以在 `.opencode/plugins/` 中放一个加载文件。

上面的脚本也可以通过 `--project` 自动生成它。

`.opencode/plugins/open-claude-code.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

## 作为库使用

可复用的 runtime 和 loader API 通过 `compat` 子路径暴露。

```ts
import { createClaudeCompatRuntime } from "@open-claude-code/opencode/compat"

const runtime = await createClaudeCompatRuntime({
  directory: process.cwd(),
})

const instruction = runtime.invokeSkill("review", "focus on risky changes")
```

## 开发命令

在仓库根目录执行以下命令：

```bash
npm run build
npm run typecheck
npm test
```

发布前也可以用下面的命令一次性完成校验：

```bash
npm run release:check
```

## 发布

### 手动发布

```bash
npm publish --access public
```

### GitHub Actions 自动发布

这个仓库包含一个基于 tag 的工作流；当你推送 `v0.1.0` 这样的 tag 时，它会自动发布到 npm。

使用前请先准备：

- 在仓库 Secret 中添加 `NPM_TOKEN`
- 确认 tag 版本与 `package.json` 版本一致
- 先执行 `npm run release:check` 做发布前校验

示例：

```bash
git tag v0.1.0
git push origin v0.1.0
```

如果你打算公开发布这个包，建议在首次发布前把 `UNLICENSED` 改成你真正想使用的许可证。

## 主要 API

- plugin 入口: `src/index.ts` 的 `default export`
- library 入口: `@open-claude-code/opencode/compat`
- `loadClaudeCompatConfig()`
- `discoverClaudePlugins()`
- `loadAllPluginComponents()`
- `createClaudeCompatRuntime()`
- `createClaudeCompatConfigHandler()`

## 说明

- OpenCode 官方同时支持基于 config 的 npm plugin 与基于文件的 local plugin。
- 这个包现在已经整理成可发布到 npm 的形式，正式发布前建议先运行 `npm pack --dry-run`。
- 当前包在执行 `npm run build` 后已经可以作为 local OpenCode plugin 使用。
- 这个包刻意保持精简，不包含 `oh-my-openagent` 中完整的 tmux 或 background-agent 栈。
