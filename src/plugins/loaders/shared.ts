import { readFileSync, realpathSync } from "node:fs"

import type { MarkdownInstructionFrontmatter } from "../types"
import { parseFrontmatter } from "../frontmatter"

export function parseToolsConfig(tools: unknown): string[] | undefined {
  if (!tools) {
    return undefined
  }

  if (Array.isArray(tools)) {
    const parsed = tools
      .map((value) => String(value).trim())
      .filter(Boolean)
    return parsed.length > 0 ? parsed : undefined
  }

  if (typeof tools !== "string") {
    return undefined
  }

  const parsed = tools
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : undefined
}

export function readMarkdownInstruction<T extends MarkdownInstructionFrontmatter>(filePath: string): {
  data: T
  body: string
} {
  const content = readFileSync(filePath, "utf-8")
  const parsed = parseFrontmatter<T>(content)
  return {
    data: parsed.data,
    body: parsed.body.trim(),
  }
}

export function resolveSymlinkPath(filePath: string): string {
  return realpathSync(filePath)
}

export function applyEnvironmentVariables(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => process.env[name] ?? "")
  }

  if (Array.isArray(value)) {
    return value.map((entry) => applyEnvironmentVariables(entry))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, applyEnvironmentVariables(entry)]),
    )
  }

  return value
}
