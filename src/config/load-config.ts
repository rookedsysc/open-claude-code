import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { readFile } from "node:fs/promises"

import type { ClaudeCompatConfig, ConfigSourceInfo } from "../types"
import { detectConfigFile, parseJsonc } from "./jsonc"
import { mergeClaudeCompatConfig } from "./merge-config"
import { ClaudeCompatConfigSchema, type ClaudeCompatConfigInput } from "./schema"

const PARTIAL_STRING_ARRAY_KEYS = new Set([
  "disabled_agents",
  "disabled_commands",
  "disabled_hooks",
  "disabled_mcps",
  "disabled_skills",
  "disabled_tools",
])

export interface LoadClaudeCompatConfigOptions {
  directory?: string
  userConfigDir?: string
  defaults?: ClaudeCompatConfig
}

export interface LoadClaudeCompatConfigResult {
  config: ClaudeCompatConfig
  sources: ConfigSourceInfo[]
}

export function getDefaultUserConfigDir(): string {
  return join(homedir(), ".config", "claude-compat")
}

export function getUserConfigBasePath(userConfigDir = getDefaultUserConfigDir()): string {
  return join(userConfigDir, "claude-compat")
}

export function getProjectConfigBasePath(directory = process.cwd()): string {
  return join(directory, ".opencode", "claude-compat")
}

export function parseConfigPartially(rawConfig: Record<string, unknown>): ClaudeCompatConfig {
  const fullResult = ClaudeCompatConfigSchema.safeParse(rawConfig)
  if (fullResult.success) {
    return fullResult.data
  }

  const partialConfig: Record<string, unknown> = {}

  for (const key of Object.keys(rawConfig)) {
    if (PARTIAL_STRING_ARRAY_KEYS.has(key)) {
      const sectionValue = rawConfig[key]
      if (Array.isArray(sectionValue) && sectionValue.every((value) => typeof value === "string")) {
        partialConfig[key] = sectionValue
      }
      continue
    }

    const sectionResult = ClaudeCompatConfigSchema.safeParse({ [key]: rawConfig[key] })
    if (!sectionResult.success) {
      continue
    }

    const parsed = sectionResult.data as Record<string, unknown>
    if (parsed[key] !== undefined) {
      partialConfig[key] = parsed[key]
    }
  }

  return partialConfig as ClaudeCompatConfig
}

export function loadConfigFromPath(configPath: string): ClaudeCompatConfig | null {
  if (!existsSync(configPath)) {
    return null
  }

  try {
    const rawConfig = parseJsonc<ClaudeCompatConfigInput>(readFileSync(configPath, "utf-8"))
    const result = ClaudeCompatConfigSchema.safeParse(rawConfig)
    if (result.success) {
      return result.data
    }

    return parseConfigPartially(rawConfig as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function readConfigFromPath(configPath: string): Promise<ClaudeCompatConfig | null> {
  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = await readFile(configPath, "utf-8")
    const rawConfig = parseJsonc<ClaudeCompatConfigInput>(content)
    const result = ClaudeCompatConfigSchema.safeParse(rawConfig)
    if (result.success) {
      return result.data
    }

    return parseConfigPartially(rawConfig as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function loadClaudeCompatConfig(
  options: LoadClaudeCompatConfigOptions = {},
): Promise<LoadClaudeCompatConfigResult> {
  const directory = options.directory ?? process.cwd()
  const defaults = options.defaults ?? {}

  const userDetected = detectConfigFile(getUserConfigBasePath(options.userConfigDir))
  const projectDetected = detectConfigFile(getProjectConfigBasePath(directory))

  let config = defaults
  const sources: ConfigSourceInfo[] = [
    { scope: "defaults", loaded: true },
    {
      scope: "user",
      path: userDetected.path,
      loaded: false,
    },
    {
      scope: "project",
      path: projectDetected.path,
      loaded: false,
    },
  ]

  const userConfig = await readConfigFromPath(userDetected.path)
  if (userConfig) {
    config = mergeClaudeCompatConfig(config, userConfig)
    sources[1].loaded = true
  }

  const projectConfig = await readConfigFromPath(projectDetected.path)
  if (projectConfig) {
    config = mergeClaudeCompatConfig(config, projectConfig)
    sources[2].loaded = true
  }

  return {
    config,
    sources,
  }
}
