# Claude Compat Plugin

[English](../README.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

Claude 스타일 호환 기능을 OpenCode에 연결하기 위한 루트 OpenCode plugin 패키지입니다.

## 개요

이 저장소는 이제 OpenCode plugin 패키지 기준으로 구성되어 있습니다.

- 실제 구현은 `src/` 아래에 있습니다
- 패키지 엔트리포인트는 OpenCode plugin의 default export를 제공합니다
- 재사용 가능한 프로그래밍 API는 `./compat` 서브패스로 제공합니다

현재 구현은 `oh-my-openagent`에서 추출한 Claude 호환 레이어에 집중합니다.

- config 스키마, 로딩, merge 규칙
- Claude plugin 탐색과 component 로딩
- Claude command, skill, agent 로딩
- `invokeSkill()`과 `runTask()`를 위한 runtime 구성
- OpenCode `config` hook을 통한 commands, agents, MCP 주입

## 프로젝트 구조

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

## 요구 사항

- Node.js 22+ 권장
- npm 10+ 권장

## 설치 방법

### npm에서 설치

패키지를 publish한 뒤에는 아래처럼 설치할 수 있습니다.

```bash
npm install opencode-claude-compat
```

### 소스에서 설치

직접 publish하기 전에는 소스에서 바로 설치해서 사용할 수도 있습니다.

```bash
git clone <your-repo-url>
cd feat-oh-my-opencode
npm install
npm run build
```

## OpenCode에서 사용하기

### bash 스크립트로 자동 설치

번들된 스크립트로 로더 설치를 자동화할 수 있습니다.

```bash
bash scripts/install-opencode-plugin.sh --global
```

프로젝트 로컬 설정은 아래처럼 설치할 수 있습니다.

```bash
bash scripts/install-opencode-plugin.sh --project /path/to/project
```

이미 build가 끝났다면 다시 build하지 않도록 할 수도 있습니다.

```bash
bash scripts/install-opencode-plugin.sh --global --skip-build
```

### 전역 local plugin 설정

OpenCode는 `~/.config/opencode/plugins/` 아래의 JavaScript/TypeScript plugin 파일을 로드합니다.

위 스크립트를 실행하면 아래 로더 파일이 자동으로 생성됩니다.

`~/.config/opencode/plugins/claude-compat.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

패키지가 아직 배포되지 않았기 때문에, 지금 기준으로는 이 방식이 가장 현실적인 전역 설정 방법입니다.

### 전역 npm plugin 설정

나중에 npm 배포를 하면 OpenCode 전역 config에서 바로 불러올 수 있습니다.

`~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-claude-compat"]
}
```

### 프로젝트 local plugin 설정

프로젝트별로 쓰고 싶다면 `.opencode/plugins/` 아래에 로더 파일을 둘 수도 있습니다.

위 스크립트에서 `--project` 옵션으로 자동 생성할 수 있습니다.

`.opencode/plugins/claude-compat.js`

```js
import ClaudeCompatPlugin from "/absolute/path/to/feat-oh-my-opencode/dist/index.js"

export default ClaudeCompatPlugin
```

## 라이브러리로 사용하기

재사용 가능한 runtime/loader API는 `compat` 서브패스로 노출됩니다.

```ts
import { createClaudeCompatRuntime } from "opencode-claude-compat/compat"

const runtime = await createClaudeCompatRuntime({
  directory: process.cwd(),
})

const instruction = runtime.invokeSkill("review", "위험한 변경에 집중")
```

## 개발 명령어

저장소 루트에서 아래 명령어를 실행하면 됩니다.

```bash
npm run build
npm run typecheck
npm test
```

## 주요 API

- plugin entry: `src/index.ts`의 `default export`
- library entry: `opencode-claude-compat/compat`
- `loadClaudeCompatConfig()`
- `discoverClaudePlugins()`
- `loadAllPluginComponents()`
- `createClaudeCompatRuntime()`
- `createClaudeCompatConfigHandler()`

## 참고

- OpenCode는 공식적으로 config 기반 npm plugin과 파일 기반 local plugin 둘 다 지원합니다.
- 패키지는 이제 npm publish 가능한 형태로 정리되어 있고, 실제 배포 전에는 `npm pack --dry-run` 검증을 권장합니다.
- 현재 패키지는 `npm run build` 이후 local OpenCode plugin으로 바로 사용할 수 있습니다.
- 이 패키지는 의도적으로 최소 범위만 포함하며, `oh-my-openagent`의 전체 tmux/background-agent 스택은 포함하지 않습니다.
