import { z } from "zod"

export const ClaudeCodeConfigSchema = z.object({
  mcp: z.boolean().optional(),
  commands: z.boolean().optional(),
  skills: z.boolean().optional(),
  agents: z.boolean().optional(),
  hooks: z.boolean().optional(),
  plugins: z.boolean().optional(),
  plugins_override: z.record(z.string(), z.boolean()).optional(),
})

export const ClaudeCompatConfigSchema = z.object({
  disabled_agents: z.array(z.string()).optional(),
  disabled_commands: z.array(z.string()).optional(),
  disabled_hooks: z.array(z.string()).optional(),
  disabled_mcps: z.array(z.string()).optional(),
  disabled_skills: z.array(z.string()).optional(),
  disabled_tools: z.array(z.string()).optional(),
  claude_code: ClaudeCodeConfigSchema.optional(),
  skills: z.record(z.string(), z.unknown()).optional(),
})

export type ClaudeCompatConfigInput = z.input<typeof ClaudeCompatConfigSchema>
