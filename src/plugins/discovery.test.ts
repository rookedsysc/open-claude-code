import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, it } from "node:test"

import { discoverClaudePlugins } from "./discovery"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "claude-plugin-discovery-"))
  testDirectories.push(directory)
  return directory
}

describe("discoverClaudePlugins", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("honors Claude settings and override precedence", () => {
    const claudeDir = createTempDir()
    const pluginsDir = join(claudeDir, "plugins")
    const installPath = join(claudeDir, "installed", "demo-plugin")

    mkdirSync(join(installPath, ".claude-plugin"), { recursive: true })
    mkdirSync(pluginsDir, { recursive: true })

    writeFileSync(
      join(pluginsDir, "installed_plugins.json"),
      JSON.stringify({
        version: 2,
        plugins: {
          "demo@market": [
            {
              scope: "user",
              installPath,
              version: "1.0.0",
            },
          ],
        },
      }),
    )
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ enabledPlugins: { "demo@market": false } }))
    writeFileSync(join(installPath, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "demo-plugin" }))

    const disabledBySettings = discoverClaudePlugins({ claudeDir })
    assert.equal(disabledBySettings.plugins.length, 0)

    const forcedByOverride = discoverClaudePlugins({
      claudeDir,
      enabledPluginsOverride: { "demo@market": true },
    })
    assert.equal(forcedByOverride.plugins.length, 1)
    assert.equal(forcedByOverride.plugins[0]?.name, "demo-plugin")
  })
})
