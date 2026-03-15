import { existsSync, readFileSync } from "node:fs"

import type { LoadedPlugin, PluginMcpServerDefinition } from "../types"
import { applyEnvironmentVariables } from "./shared"

interface PluginMcpConfig {
  mcpServers?: Record<string, PluginMcpServerDefinition>
}

export function loadPluginMcps(plugins: LoadedPlugin[]): Record<string, PluginMcpServerDefinition> {
  const mcps: Record<string, PluginMcpServerDefinition> = {}

  for (const plugin of plugins) {
    if (!plugin.mcpPath || !existsSync(plugin.mcpPath)) {
      continue
    }

    let parsed: PluginMcpConfig
    try {
      parsed = JSON.parse(readFileSync(plugin.mcpPath, "utf-8")) as PluginMcpConfig
    } catch {
      continue
    }

    const transformed = applyEnvironmentVariables(parsed) as PluginMcpConfig
    for (const [name, serverConfig] of Object.entries(transformed.mcpServers ?? {})) {
      if (serverConfig.disabled) {
        continue
      }

      mcps[`${plugin.name}:${name}`] = serverConfig
    }
  }

  return mcps
}
