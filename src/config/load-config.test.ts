import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { loadClaudeCompatConfig, parseConfigPartially } from "./load-config"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-compat-"))
  testDirectories.push(directory)
  return directory
}

describe("loadClaudeCompatConfig", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("loads defaults, user config, and project config in order", async () => {
    const projectDir = createTempDir()
    const userConfigDir = createTempDir()

    mkdirSync(join(projectDir, ".opencode"), { recursive: true })

    writeFileSync(
      join(userConfigDir, "claude-compat.jsonc"),
      `{
        // user config
        "disabled_agents": ["user-agent"],
        "claude_code": {
          "plugins": true,
        },
      }`,
    )

    writeFileSync(
      join(projectDir, ".opencode", "claude-compat.jsonc"),
      `{
        "disabled_agents": ["project-agent"],
        "claude_code": {
          "skills": false,
        },
      }`,
    )

    const result = await loadClaudeCompatConfig({
      directory: projectDir,
      userConfigDir,
      defaults: {
        disabled_agents: ["default-agent"],
      },
    })

    assert.deepEqual(result.config.disabled_agents, [
      "default-agent",
      "user-agent",
      "project-agent",
    ])
    assert.equal(result.config.claude_code?.plugins, true)
    assert.equal(result.config.claude_code?.skills, false)
    assert.deepEqual(result.sources.map((source) => source.loaded), [true, true, true])
  })

  it("keeps valid sections when a config contains invalid sections", () => {
    const partial = parseConfigPartially({
      disabled_agents: ["valid-agent"],
      disabled_skills: [1, 2],
      claude_code: {
        plugins: true,
      },
      extra: {
        ignored: true,
      },
    })

    assert.deepEqual(partial.disabled_agents, ["valid-agent"])
    assert.equal(partial.claude_code?.plugins, true)
    assert.equal(partial.disabled_skills, undefined)
  })
})
