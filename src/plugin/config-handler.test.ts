import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { createClaudeCompatConfigHandler } from "./config-handler"
import type { OpenCodeMutableConfig } from "./types"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-compat-plugin-"))
  testDirectories.push(directory)
  return directory
}

describe("createClaudeCompatConfigHandler", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("injects commands, skills, agents, and mcps while preserving explicit config overrides", async () => {
    const projectDir = createTempDir()
    const claudeDir = createTempDir()
    const pluginInstallPath = join(claudeDir, "installed", "demo-plugin")

    mkdirSync(join(projectDir, ".claude", "commands"), { recursive: true })
    mkdirSync(join(projectDir, ".claude", "skills", "review"), { recursive: true })
    mkdirSync(join(projectDir, ".claude", "agents"), { recursive: true })
    mkdirSync(join(projectDir, ".opencode"), { recursive: true })
    mkdirSync(join(claudeDir, "plugins"), { recursive: true })
    mkdirSync(join(pluginInstallPath, ".claude-plugin"), { recursive: true })
    mkdirSync(join(pluginInstallPath, "commands"), { recursive: true })
    mkdirSync(join(pluginInstallPath, "agents"), { recursive: true })
    mkdirSync(join(pluginInstallPath, "skills", "ship"), { recursive: true })

    writeFileSync(
      join(projectDir, ".claude", "commands", "review.md"),
      "---\ndescription: Review command\n---\nReview the patch.",
    )
    writeFileSync(
      join(projectDir, ".claude", "skills", "review", "SKILL.md"),
      "---\ndescription: Review skill\n---\nLook for risks.",
    )
    writeFileSync(
      join(projectDir, ".claude", "agents", "explore.md"),
      "---\ndescription: Explore agent\nmode: subagent\ntools: read grep\n---\nExplore deeply.",
    )
    writeFileSync(
      join(claudeDir, "plugins", "installed_plugins.json"),
      JSON.stringify({
        version: 1,
        plugins: {
          "demo@market": {
            scope: "user",
            installPath: pluginInstallPath,
            version: "1.0.0",
          },
        },
      }),
    )
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ enabledPlugins: { "demo@market": true } }))
    writeFileSync(join(pluginInstallPath, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "demo-plugin" }))
    writeFileSync(
      join(pluginInstallPath, "commands", "publish.md"),
      "---\ndescription: Publish command\n---\nShip it.",
    )
    writeFileSync(
      join(pluginInstallPath, "agents", "ship-agent.md"),
      "---\ndescription: Shipping agent\nmode: subagent\n---\nShip carefully.",
    )
    writeFileSync(
      join(pluginInstallPath, "skills", "ship", "SKILL.md"),
      "---\ndescription: Ship skill\n---\nPrepare release checklist.",
    )
    writeFileSync(
      join(pluginInstallPath, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          docs: { type: "http", url: "https://example.com/mcp" },
        },
      }),
    )

    const config: OpenCodeMutableConfig = {
      command: {
        review: {
          description: "Existing review command",
          template: "Existing template",
        },
      },
      mcp: {
        "demo-plugin:docs": {
          type: "http",
          url: "https://override.example.com/mcp",
        },
      },
    }

    const handler = createClaudeCompatConfigHandler({ directory: projectDir, claudeDir })
    await handler(config)

    assert.equal(config.command?.review?.template, "Existing template")
    assert.ok(config.command?.["demo-plugin:publish"])
    assert.ok(config.command?.["demo-plugin:ship"])
    assert.deepEqual(config.agent?.explore?.tools, { read: true, grep: true })
    assert.ok(config.agent?.["demo-plugin:ship-agent"])
    assert.equal(config.mcp?.["demo-plugin:docs"]?.url, "https://override.example.com/mcp")
  })
})
