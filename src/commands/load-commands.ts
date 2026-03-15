import { existsSync, readdirSync, realpathSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

import { parseFrontmatter } from "../plugins/frontmatter"
import type { LoadedCommandDefinition, MarkdownInstructionFrontmatter } from "../plugins/types"

export interface LoadClaudeCommandsOptions {
  directory?: string
  claudeDir?: string
}

function getClaudeDir(claudeDir?: string): string {
  return claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude")
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.endsWith(".md")
}

function loadCommandsFromDir(
  commandsDir: string,
  prefix = "",
  visited = new Set<string>(),
): Record<string, LoadedCommandDefinition> {
  if (!existsSync(commandsDir)) {
    return {}
  }

  const realPath = realpathSync(commandsDir)
  if (visited.has(realPath)) {
    return {}
  }
  visited.add(realPath)

  const commands: Record<string, LoadedCommandDefinition> = {}
  const entries = readdirSync(commandsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue
    }

    if (entry.isDirectory()) {
      const nested = loadCommandsFromDir(
        join(commandsDir, entry.name),
        prefix ? `${prefix}:${entry.name}` : entry.name,
        visited,
      )
      Object.assign(commands, nested)
      continue
    }

    if (!entry.isFile() || !isMarkdownFile(entry.name)) {
      continue
    }

    const commandPath = join(commandsDir, entry.name)
    const fallbackName = basename(entry.name, ".md")
    const commandName = prefix ? `${prefix}:${fallbackName}` : fallbackName
    const { data, body } = parseFrontmatter<MarkdownInstructionFrontmatter>(readFileSync(commandPath, "utf-8"))

    commands[commandName] = {
      name: commandName,
      description: `(claude) ${data.description ?? ""}`.trim(),
      template: `<command-instruction>\n${body.trim()}\n</command-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`,
      agent: data.agent,
      model: data.model,
      subtask: data.subtask,
      argumentHint: data["argument-hint"],
    }
  }

  return commands
}

export function loadUserClaudeCommands(options: LoadClaudeCommandsOptions = {}): Record<string, LoadedCommandDefinition> {
  return loadCommandsFromDir(join(getClaudeDir(options.claudeDir), "commands"))
}

export function loadProjectClaudeCommands(options: LoadClaudeCommandsOptions = {}): Record<string, LoadedCommandDefinition> {
  return loadCommandsFromDir(join(options.directory ?? process.cwd(), ".claude", "commands"))
}
