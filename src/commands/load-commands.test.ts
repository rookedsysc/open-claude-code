import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { loadProjectClaudeCommands } from "./load-commands"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-commands-"))
  testDirectories.push(directory)
  return directory
}

describe("loadProjectClaudeCommands", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("중첩된 프로젝트 command 파일을 command 템플릿으로 로드한다", () => {
    // 주어진 환경
    const projectDir = createTempDir()
    const commandsDir = join(projectDir, ".claude", "commands", "release")

    mkdirSync(commandsDir, { recursive: true })
    writeFileSync(
      join(commandsDir, "publish.md"),
      "---\ndescription: Publish the release\nagent: releaser\n---\nShip the package safely.",
    )
    writeFileSync(join(commandsDir, ".draft.md"), "Ignore hidden files")

    // 실행
    const commands = loadProjectClaudeCommands({ directory: projectDir })

    // 검증
    assert.deepEqual(Object.keys(commands), ["release:publish"])
    assert.equal(commands["release:publish"]?.description, "(claude) Publish the release")
    assert.equal(commands["release:publish"]?.agent, "releaser")
    assert.ok(commands["release:publish"]?.template.includes("Ship the package safely."))
    assert.ok(commands["release:publish"]?.template.includes("$ARGUMENTS"))
  })
})
