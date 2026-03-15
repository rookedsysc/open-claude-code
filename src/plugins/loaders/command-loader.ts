import { basename, join } from "node:path"
import { existsSync, readdirSync } from "node:fs"

import type { LoadedCommandDefinition, LoadedPlugin, MarkdownInstructionFrontmatter } from "../types"
import { readMarkdownInstruction } from "./shared"

function isMarkdownFile(fileName: string): boolean {
  return fileName.endsWith(".md")
}

export function loadPluginCommands(plugins: LoadedPlugin[]): Record<string, LoadedCommandDefinition> {
  const commands: Record<string, LoadedCommandDefinition> = {}

  for (const plugin of plugins) {
    if (!plugin.commandsDir || !existsSync(plugin.commandsDir)) {
      continue
    }

    const entries = readdirSync(plugin.commandsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !isMarkdownFile(entry.name)) {
        continue
      }

      const commandPath = join(plugin.commandsDir, entry.name)
      const commandName = basename(entry.name, ".md")
      const namespacedName = `${plugin.name}:${commandName}`
      const { data, body } = readMarkdownInstruction<MarkdownInstructionFrontmatter>(commandPath)

      commands[namespacedName] = {
        name: namespacedName,
        description: `(plugin: ${plugin.name}) ${data.description ?? ""}`.trim(),
        template: `<command-instruction>\n${body}\n</command-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`,
        agent: data.agent,
        model: data.model,
        subtask: data.subtask,
        argumentHint: data["argument-hint"],
      }
    }
  }

  return commands
}
