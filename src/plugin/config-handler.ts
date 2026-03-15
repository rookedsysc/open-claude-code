import { createClaudeCompatRuntime, type CreateClaudeCompatRuntimeOptions } from "../runtime"
import type {
  LoadedAgentDefinition,
  LoadedCommandDefinition,
  LoadedSkillDefinition,
  PluginMcpServerDefinition,
} from "../plugins"
import type { OpenCodeAgentConfig, OpenCodeCommandConfig, OpenCodeMutableConfig } from "./types"

function toCommandConfig(definition: LoadedCommandDefinition | LoadedSkillDefinition): OpenCodeCommandConfig {
  return {
    description: definition.description,
    template: definition.template,
    agent: definition.agent,
    model: definition.model,
    subtask: definition.subtask,
    argumentHint: definition.argumentHint,
  }
}

function toAgentConfig(definition: LoadedAgentDefinition): OpenCodeAgentConfig {
  return {
    description: definition.description,
    prompt: definition.prompt,
    mode: definition.mode,
    model: definition.model,
    tools: definition.tools
      ? Object.fromEntries(definition.tools.map((toolName) => [toolName, true]))
      : undefined,
  }
}

function toPlainRecord<T>(value: unknown): Record<string, T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, T>
}

function mapCommands(commands: Record<string, LoadedCommandDefinition>): Record<string, OpenCodeCommandConfig> {
  return Object.fromEntries(
    Object.entries(commands).map(([name, definition]) => [name, toCommandConfig(definition)]),
  )
}

function mapSkillsToCommands(skills: Record<string, LoadedSkillDefinition>): Record<string, OpenCodeCommandConfig> {
  return Object.fromEntries(
    Object.entries(skills).map(([name, definition]) => [name, toCommandConfig(definition)]),
  )
}

function mapAgents(agents: Record<string, LoadedAgentDefinition>): Record<string, OpenCodeAgentConfig> {
  return Object.fromEntries(
    Object.entries(agents).map(([name, definition]) => [name, toAgentConfig(definition)]),
  )
}

function mapMcps(
  mcps: Record<string, PluginMcpServerDefinition>,
): Record<string, PluginMcpServerDefinition & Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(mcps).map(([name, definition]) => [name, { ...definition }]),
  )
}

export function createClaudeCompatConfigHandler(options: CreateClaudeCompatRuntimeOptions) {
  return async (config: Record<string, unknown>): Promise<void> => {
    const mutableConfig = config as OpenCodeMutableConfig
    const runtime = await createClaudeCompatRuntime(options)

    const existingCommands = toPlainRecord<OpenCodeCommandConfig>(mutableConfig.command)
    const existingAgents = toPlainRecord<OpenCodeAgentConfig>(mutableConfig.agent)
    const existingMcps = toPlainRecord<PluginMcpServerDefinition & Record<string, unknown>>(mutableConfig.mcp)

    mutableConfig.command = {
      ...mapCommands(runtime.commands),
      ...mapSkillsToCommands(runtime.skills),
      ...existingCommands,
    }

    mutableConfig.agent = {
      ...mapAgents(runtime.agents),
      ...existingAgents,
    }

    mutableConfig.mcp = {
      ...mapMcps(runtime.mcps),
      ...existingMcps,
    }
  }
}
