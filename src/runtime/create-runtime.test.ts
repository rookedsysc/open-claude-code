import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { createClaudeCompatRuntime } from "./create-runtime"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-runtime-"))
  testDirectories.push(directory)
  return directory
}

describe("createClaudeCompatRuntime", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("loads local and plugin registries and invokes skills", async () => {
    const projectDir = createTempDir()
    const claudeDir = createTempDir()
    const pluginsDir = join(claudeDir, "plugins")
    const installPath = join(claudeDir, "installed", "demo-plugin")

    mkdirSync(join(projectDir, ".claude", "skills", "review"), { recursive: true })
    mkdirSync(join(projectDir, ".claude", "agents"), { recursive: true })
    mkdirSync(join(projectDir, ".opencode"), { recursive: true })
    mkdirSync(join(installPath, ".claude-plugin"), { recursive: true })
    mkdirSync(join(installPath, "commands"), { recursive: true })
    mkdirSync(pluginsDir, { recursive: true })

    writeFileSync(
      join(projectDir, ".claude", "skills", "review", "SKILL.md"),
      "---\ndescription: Review skill\n---\nInspect every file carefully.",
    )
    writeFileSync(
      join(projectDir, ".claude", "agents", "explore.md"),
      "---\ndescription: Explore agent\nmode: subagent\n---\nExplore the codebase.",
    )
    writeFileSync(
      join(projectDir, ".opencode", "claude-compat.jsonc"),
      "{\n  \"claude_code\": {\n    \"plugins\": true\n  }\n}",
    )

    writeFileSync(
      join(pluginsDir, "installed_plugins.json"),
      JSON.stringify({
        version: 1,
        plugins: {
          "demo@market": {
            scope: "user",
            installPath,
            version: "1.0.0",
          },
        },
      }),
    )
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ enabledPlugins: { "demo@market": true } }))
    writeFileSync(join(installPath, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "demo-plugin" }))
    writeFileSync(
      join(installPath, "commands", "publish.md"),
      "---\ndescription: Publish command\n---\nShip the release.",
    )

    const runtime = await createClaudeCompatRuntime({ directory: projectDir, claudeDir })
    const invoked = runtime.invokeSkill("review", "focus on risks")

    assert.ok(runtime.skills.review)
    assert.ok(runtime.commands["demo-plugin:publish"])
    assert.ok(runtime.agents.explore)
    assert.equal(invoked.kind, "skill")
    assert.ok(invoked.content.includes("focus on risks"))
  })

  it("builds a task payload with injected skills", async () => {
    const projectDir = createTempDir()

    mkdirSync(join(projectDir, ".claude", "skills", "ship"), { recursive: true })
    mkdirSync(join(projectDir, ".claude", "agents"), { recursive: true })

    writeFileSync(
      join(projectDir, ".claude", "skills", "ship", "SKILL.md"),
      "---\ndescription: Ship skill\n---\nPrepare release notes.",
    )
    writeFileSync(
      join(projectDir, ".claude", "agents", "release-agent.md"),
      "---\ndescription: Release agent\nmode: subagent\n---\nShip safely.",
    )

    const runtime = await createClaudeCompatRuntime({ directory: projectDir })
    const task = runtime.runTask({
      description: "Release build",
      prompt: "Publish the next patch version.",
      subagent_type: "release-agent",
      load_skills: ["ship"],
    })

    assert.equal(task.agent, "release-agent")
    assert.equal(task.background, false)
    assert.ok(task.prompt.includes("Prepare release notes."))
    assert.ok(task.prompt.includes("Publish the next patch version."))
  })
})
