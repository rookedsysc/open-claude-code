import type { PluginMcpServerDefinition } from "../plugins"

export interface OpenCodeCommandConfig {
  description?: string
  template: string
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
}

export interface OpenCodeAgentConfig {
  description?: string
  prompt?: string
  mode?: "subagent" | "primary" | "all"
  model?: string
  tools?: Record<string, boolean>
}

export interface OpenCodeMutableConfig extends Record<string, unknown> {
  command?: Record<string, OpenCodeCommandConfig | undefined>
  agent?: Record<string, OpenCodeAgentConfig | undefined>
  mcp?: Record<string, (PluginMcpServerDefinition & Record<string, unknown>) | undefined>
}
