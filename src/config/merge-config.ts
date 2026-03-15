import type { ClaudeCompatConfig, DisabledCollectionKey } from "../types"

const DISABLED_COLLECTION_KEYS: DisabledCollectionKey[] = [
  "disabled_agents",
  "disabled_commands",
  "disabled_hooks",
  "disabled_mcps",
  "disabled_skills",
  "disabled_tools",
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMergeRecords<T extends object>(
  base: T | undefined,
  override: T | undefined,
): T | undefined {
  if (!base) return override
  if (!override) return base

  const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) }

  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const current = merged[key]
    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = deepMergeRecords(current, value)
      continue
    }

    merged[key] = value
  }

  return merged as T
}

function mergeDisabledCollections(
  key: DisabledCollectionKey,
  base: ClaudeCompatConfig,
  override: ClaudeCompatConfig,
): string[] | undefined {
  const values = [...(base[key] ?? []), ...(override[key] ?? [])]
  if (values.length === 0) {
    return undefined
  }

  return [...new Set(values)]
}

export function mergeClaudeCompatConfig(
  base: ClaudeCompatConfig,
  override: ClaudeCompatConfig,
): ClaudeCompatConfig {
  const merged: ClaudeCompatConfig = {
    ...base,
    ...override,
    claude_code: deepMergeRecords(base.claude_code, override.claude_code),
    skills: deepMergeRecords(base.skills, override.skills),
  }

  for (const key of DISABLED_COLLECTION_KEYS) {
    merged[key] = mergeDisabledCollections(key, base, override)
  }

  return merged
}
