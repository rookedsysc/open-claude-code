import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { loadProjectClaudeSkills } from "./load-skills"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-skills-"))
  testDirectories.push(directory)
  return directory
}

describe("loadProjectClaudeSkills", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("프로젝트 skill 디렉터리를 재귀적으로 로드하고 깊이 제한을 적용한다", () => {
    // 주어진 환경
    const projectDir = createTempDir()
    const skillsDir = join(projectDir, ".claude", "skills")

    mkdirSync(join(skillsDir, "platform", "release"), { recursive: true })
    mkdirSync(join(skillsDir, "platform", "core", "audit"), { recursive: true })
    mkdirSync(join(skillsDir, "guides"), { recursive: true })

    writeFileSync(
      join(skillsDir, "platform", "release", "SKILL.md"),
      "---\ndescription: Release skill\n---\nPrepare the release checklist.",
    )
    writeFileSync(
      join(skillsDir, "platform", "core", "audit", "SKILL.md"),
      "---\ndescription: Deep audit skill\n---\nInspect low-level details.",
    )
    writeFileSync(
      join(skillsDir, "guides", "guides.md"),
      "---\ndescription: Guide skill\nname: guide\n---\nExplain the project structure.",
    )

    // 실행
    const skills = loadProjectClaudeSkills({ directory: projectDir, maxDepth: 1 })

    // 검증
    assert.ok(skills["platform/release"])
    assert.ok(skills.guide)
    assert.equal(skills["platform/core/audit"], undefined)
    assert.ok(skills["platform/release"]?.template.includes("Base directory for this skill:"))
    assert.ok(skills["platform/release"]?.location.endsWith(join("platform", "release")))
  })
})
