export type PluginScope = "user" | "project" | "local" | "managed"

export interface PluginInstallation {
  scope: PluginScope
  installPath: string
  version: string
  installedAt?: string
  lastUpdated?: string
  gitCommitSha?: string
  isLocal?: boolean
}

export interface InstalledPluginsDatabaseV1 {
  version: 1
  plugins: Record<string, PluginInstallation>
}

export interface InstalledPluginsDatabaseV2 {
  version: 2
  plugins: Record<string, PluginInstallation[]>
}

export type InstalledPluginsDatabase = InstalledPluginsDatabaseV1 | InstalledPluginsDatabaseV2

export interface PluginManifest {
  name: string
  version?: string
  description?: string
  commands?: string | string[]
  agents?: string | string[]
  skills?: string | string[]
  mcpServers?: string | { mcpServers?: Record<string, PluginMcpServerDefinition> }
}

export interface LoadedPlugin {
  name: string
  version: string
  scope: PluginScope
  installPath: string
  pluginKey: string
  manifest?: PluginManifest
  commandsDir?: string
  agentsDir?: string
  skillsDir?: string
  mcpPath?: string
}

export interface PluginLoadError {
  pluginKey: string
  installPath: string
  error: string
}

export interface ClaudeSettings {
  enabledPlugins?: Record<string, boolean>
  [key: string]: unknown
}

export interface DiscoverClaudePluginsOptions {
  claudeDir?: string
  enabledPluginsOverride?: Record<string, boolean>
}

export interface DiscoverClaudePluginsResult {
  plugins: LoadedPlugin[]
  errors: PluginLoadError[]
}

export interface MarkdownInstructionFrontmatter {
  description?: string
  agent?: string
  model?: string
  subtask?: boolean
  tools?: string
  name?: string
  ["argument-hint"]?: string
}

export interface LoadedCommandDefinition {
  name: string
  description: string
  template: string
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
}

export interface LoadedSkillDefinition extends LoadedCommandDefinition {
  location: string
}

export interface LoadedAgentDefinition {
  name: string
  description: string
  prompt: string
  mode: "subagent" | "primary" | "all"
  model?: string
  tools?: string[]
}

export interface PluginMcpServerDefinition {
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: string
  type?: "stdio" | "http" | "sse"
  disabled?: boolean
}

export interface LoadedPluginComponents {
  commands: Record<string, LoadedCommandDefinition>
  skills: Record<string, LoadedSkillDefinition>
  agents: Record<string, LoadedAgentDefinition>
  mcps: Record<string, PluginMcpServerDefinition>
  plugins: LoadedPlugin[]
  errors: PluginLoadError[]
}
