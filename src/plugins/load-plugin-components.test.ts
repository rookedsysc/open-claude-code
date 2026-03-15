import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { loadAllPluginComponents } from "./load-plugin-components"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-plugin-components-"))
  testDirectories.push(directory)
  return directory
}

describe("loadAllPluginComponents", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("loads commands, skills, agents, and mcps with plugin namespace", () => {
    const claudeDir = createTempDir()
    const pluginsDir = join(claudeDir, "plugins")
    const installPath = join(claudeDir, "installed", "demo-plugin")

    mkdirSync(join(installPath, ".claude-plugin"), { recursive: true })
    mkdirSync(join(installPath, "commands"), { recursive: true })
    mkdirSync(join(installPath, "agents"), { recursive: true })
    mkdirSync(join(installPath, "skills", "ship"), { recursive: true })
    mkdirSync(pluginsDir, { recursive: true })

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
      join(installPath, "commands", "release.md"),
      "---\ndescription: Release command\n---\nRun release steps.",
    )
    writeFileSync(
      join(installPath, "agents", "reviewer.md"),
      "---\ndescription: Reviewer\nmode: subagent\ntools: grep read\n---\nReview the change carefully.",
    )
    writeFileSync(
      join(installPath, "skills", "ship", "SKILL.md"),
      "---\ndescription: Shipping flow\n---\nPrepare release notes.",
    )
    writeFileSync(
      join(installPath, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          docs: {
            type: "http",
            url: "${DOCS_URL}",
          },
        },
      }),
    )

    process.env.DOCS_URL = "https://example.com/mcp"

    const loaded = loadAllPluginComponents({ claudeDir })

    assert.ok(loaded.commands["demo-plugin:release"])
    assert.ok(loaded.agents["demo-plugin:reviewer"])
    assert.ok(loaded.skills["demo-plugin:ship"])
    assert.deepEqual(loaded.agents["demo-plugin:reviewer"]?.tools, ["grep", "read"])
    assert.equal(loaded.mcps["demo-plugin:docs"]?.url, "https://example.com/mcp")
  })
})
