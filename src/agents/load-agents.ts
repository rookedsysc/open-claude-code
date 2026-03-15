import { existsSync, readFileSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

import { parseFrontmatter } from "../plugins/frontmatter"
import type { LoadedAgentDefinition, MarkdownInstructionFrontmatter } from "../plugins/types"

export interface LoadClaudeAgentsOptions {
  directory?: string
  claudeDir?: string
}

interface AgentFrontmatter extends MarkdownInstructionFrontmatter {
  mode?: "subagent" | "primary" | "all"
}

function getClaudeDir(claudeDir?: string): string {
  return claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude")
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.endsWith(".md")
}

function parseTools(tools: string | undefined): string[] | undefined {
  if (!tools) {
    return undefined
  }

  const parsed = tools.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}

function loadAgentsFromDir(agentsDir: string): Record<string, LoadedAgentDefinition> {
  if (!existsSync(agentsDir)) {
    return {}
  }

  const agents: Record<string, LoadedAgentDefinition> = {}
  const entries = readdirSync(agentsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile() || !isMarkdownFile(entry.name)) {
      continue
    }

    const agentPath = join(agentsDir, entry.name)
    const fallbackName = basename(entry.name, ".md")
    const { data, body } = parseFrontmatter<AgentFrontmatter>(readFileSync(agentPath, "utf-8"))
    const agentName = data.name || fallbackName

    agents[agentName] = {
      name: agentName,
      description: `(claude) ${data.description ?? ""}`.trim(),
      prompt: body.trim(),
      mode: data.mode ?? "subagent",
      model: data.model,
      tools: parseTools(data.tools),
    }
  }

  return agents
}

export function loadUserClaudeAgents(options: LoadClaudeAgentsOptions = {}): Record<string, LoadedAgentDefinition> {
  return loadAgentsFromDir(join(getClaudeDir(options.claudeDir), "agents"))
}

export function loadProjectClaudeAgents(options: LoadClaudeAgentsOptions = {}): Record<string, LoadedAgentDefinition> {
  return loadAgentsFromDir(join(options.directory ?? process.cwd(), ".claude", "agents"))
}
