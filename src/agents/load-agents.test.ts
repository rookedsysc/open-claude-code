import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { loadProjectClaudeAgents } from "./load-agents"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-agents-"))
  testDirectories.push(directory)
  return directory
}

describe("loadProjectClaudeAgents", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("프로젝트 agent 파일의 도구 목록과 기본 모드를 파싱한다", () => {
    // 주어진 환경
    const projectDir = createTempDir()
    const agentsDir = join(projectDir, ".claude", "agents")

    mkdirSync(agentsDir, { recursive: true })
    writeFileSync(
      join(agentsDir, "release-reviewer.md"),
      "---\ndescription: Review release readiness\nmode: primary\ntools: bash, read edit\n---\nReview every risky change.",
    )
    writeFileSync(
      join(agentsDir, "explorer.md"),
      "---\ndescription: Explore the repository\n---\nInspect the codebase.",
    )

    // 실행
    const agents = loadProjectClaudeAgents({ directory: projectDir })

    // 검증
    assert.equal(agents["release-reviewer"]?.mode, "primary")
    assert.deepEqual(agents["release-reviewer"]?.tools, ["bash", "read", "edit"])
    assert.equal(agents.explorer?.mode, "subagent")
    assert.equal(agents.explorer?.prompt, "Inspect the codebase.")
  })
})
