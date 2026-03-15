import { basename, join } from "node:path"
import { existsSync, readdirSync } from "node:fs"

import type { LoadedAgentDefinition, LoadedPlugin, MarkdownInstructionFrontmatter } from "../types"
import { parseToolsConfig, readMarkdownInstruction } from "./shared"

interface AgentFrontmatter extends MarkdownInstructionFrontmatter {
  mode?: "subagent" | "primary" | "all"
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.endsWith(".md")
}

export function loadPluginAgents(plugins: LoadedPlugin[]): Record<string, LoadedAgentDefinition> {
  const agents: Record<string, LoadedAgentDefinition> = {}

  for (const plugin of plugins) {
    if (!plugin.agentsDir || !existsSync(plugin.agentsDir)) {
      continue
    }

    const entries = readdirSync(plugin.agentsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !isMarkdownFile(entry.name)) {
        continue
      }

      const agentPath = join(plugin.agentsDir, entry.name)
      const fallbackName = basename(entry.name, ".md")
      const { data, body } = readMarkdownInstruction<AgentFrontmatter>(agentPath)
      const agentName = data.name || fallbackName
      const namespacedName = `${plugin.name}:${agentName}`

      agents[namespacedName] = {
        name: namespacedName,
        description: `(plugin: ${plugin.name}) ${data.description ?? ""}`.trim(),
        prompt: body,
        mode: data.mode ?? "subagent",
        model: data.model,
        tools: parseToolsConfig(data.tools),
      }
    }
  }

  return agents
}
