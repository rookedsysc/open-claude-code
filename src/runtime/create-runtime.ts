import { loadProjectClaudeAgents, loadUserClaudeAgents } from "../agents/load-agents"
import { loadProjectClaudeCommands, loadUserClaudeCommands } from "../commands/load-commands"
import { loadClaudeCompatConfig, type LoadClaudeCompatConfigOptions } from "../config"
import { loadAllPluginComponents } from "../plugins"
import type {
  LoadedAgentDefinition,
  LoadedCommandDefinition,
  LoadedPlugin,
  LoadedSkillDefinition,
  PluginMcpServerDefinition,
} from "../plugins"
import { invokeSkill, type InvokedInstruction } from "../skills/invoke-skill"
import { loadProjectClaudeSkills, loadUserClaudeSkills } from "../skills/load-skills"
import type { ClaudeCompatConfig, ConfigSourceInfo, RuntimeTaskInput, RuntimeTaskResult } from "../types"

export interface ClaudeCompatRuntime {
  config: ClaudeCompatConfig
  sources: ConfigSourceInfo[]
  plugins: LoadedPlugin[]
  commands: Record<string, LoadedCommandDefinition>
  skills: Record<string, LoadedSkillDefinition>
  agents: Record<string, LoadedAgentDefinition>
  mcps: Record<string, PluginMcpServerDefinition>
  invokeSkill: (name: string, userMessage?: string) => InvokedInstruction
  runTask: (input: RuntimeTaskInput) => RuntimeTaskResult
}

export interface CreateClaudeCompatRuntimeOptions extends LoadClaudeCompatConfigOptions {
  claudeDir?: string
}

function filterDisabledRecord<T extends { name: string }>(
  record: Record<string, T>,
  disabledNames: string[] | undefined,
): Record<string, T> {
  if (!disabledNames || disabledNames.length === 0) {
    return record
  }

  const disabledSet = new Set(disabledNames.map((name) => name.toLowerCase()))
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => !disabledSet.has(value.name.toLowerCase())),
  )
}

export async function createClaudeCompatRuntime(
  options: CreateClaudeCompatRuntimeOptions = {},
): Promise<ClaudeCompatRuntime> {
  const { config, sources } = await loadClaudeCompatConfig(options)
  const claudeDir = options.claudeDir

  const includeClaudeCommands = config.claude_code?.commands ?? true
  const includeClaudeSkills = config.claude_code?.skills ?? true
  const includeClaudeAgents = config.claude_code?.agents ?? true
  const includePlugins = config.claude_code?.plugins ?? true

  const pluginComponents = includePlugins
    ? loadAllPluginComponents({
        claudeDir,
        enabledPluginsOverride: config.claude_code?.plugins_override,
      })
    : { commands: {}, skills: {}, agents: {}, mcps: {}, plugins: [], errors: [] }

  const commands = filterDisabledRecord(
    {
      ...(includeClaudeCommands ? loadUserClaudeCommands({ directory: options.directory, claudeDir }) : {}),
      ...(includeClaudeCommands ? loadProjectClaudeCommands({ directory: options.directory, claudeDir }) : {}),
      ...pluginComponents.commands,
    },
    config.disabled_commands,
  )

  const skills = filterDisabledRecord(
    {
      ...(includeClaudeSkills ? loadUserClaudeSkills({ directory: options.directory, claudeDir }) : {}),
      ...(includeClaudeSkills ? loadProjectClaudeSkills({ directory: options.directory, claudeDir }) : {}),
      ...pluginComponents.skills,
    },
    config.disabled_skills,
  )

  const agents = filterDisabledRecord(
    {
      ...(includeClaudeAgents ? loadUserClaudeAgents({ directory: options.directory, claudeDir }) : {}),
      ...(includeClaudeAgents ? loadProjectClaudeAgents({ directory: options.directory, claudeDir }) : {}),
      ...pluginComponents.agents,
    },
    config.disabled_agents,
  )

  const disabledMcpSet = new Set((config.disabled_mcps ?? []).map((name) => name.toLowerCase()))
  const mcps = Object.fromEntries(
    Object.entries(pluginComponents.mcps).filter(([name]) => !disabledMcpSet.has(name.toLowerCase())),
  )

  return {
    config,
    sources,
    plugins: pluginComponents.plugins,
    commands,
    skills,
    agents,
    mcps,
    invokeSkill(name: string, userMessage?: string) {
      return invokeSkill(name, userMessage, { skills, commands })
    },
    runTask(input: RuntimeTaskInput) {
      if (!input.category && !input.subagent_type) {
        throw new Error("Task input must include either category or subagent_type")
      }

      if (input.subagent_type && !agents[input.subagent_type]) {
        throw new Error(`Unknown subagent_type: ${input.subagent_type}`)
      }

      const injectedSkillBlocks = (input.load_skills ?? []).map((skillName) => {
        return invokeSkill(skillName, undefined, { skills, commands }).content
      })

      const promptSections = [...injectedSkillBlocks, input.prompt].filter(Boolean)

      return {
        agent: input.subagent_type ?? `category:${input.category}`,
        background: input.run_in_background ?? false,
        prompt: promptSections.join("\n\n"),
      }
    },
  }
}
