export type DisabledCollectionKey =
  | "disabled_agents"
  | "disabled_commands"
  | "disabled_hooks"
  | "disabled_mcps"
  | "disabled_skills"
  | "disabled_tools"

export interface ClaudeCodeConfig {
  mcp?: boolean
  commands?: boolean
  skills?: boolean
  agents?: boolean
  hooks?: boolean
  plugins?: boolean
  plugins_override?: Record<string, boolean>
}

export interface ClaudeCompatConfig {
  disabled_agents?: string[]
  disabled_commands?: string[]
  disabled_hooks?: string[]
  disabled_mcps?: string[]
  disabled_skills?: string[]
  disabled_tools?: string[]
  claude_code?: ClaudeCodeConfig
  skills?: Record<string, unknown>
}

export interface ConfigSourceInfo {
  scope: "defaults" | "user" | "project"
  path?: string
  loaded: boolean
}

export interface RuntimeTaskInput {
  description: string
  prompt: string
  category?: string
  subagent_type?: string
  load_skills?: string[]
  run_in_background?: boolean
  session_id?: string
  command?: string
}

export interface RuntimeTaskResult {
  agent: string
  background: boolean
  prompt: string
}
