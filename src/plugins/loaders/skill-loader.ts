import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

import type { LoadedPlugin, LoadedSkillDefinition, MarkdownInstructionFrontmatter } from "../types"
import { readMarkdownInstruction, resolveSymlinkPath } from "./shared"

export function loadPluginSkills(plugins: LoadedPlugin[]): Record<string, LoadedSkillDefinition> {
  const skills: Record<string, LoadedSkillDefinition> = {}

  for (const plugin of plugins) {
    if (!plugin.skillsDir || !existsSync(plugin.skillsDir)) {
      continue
    }

    const entries = readdirSync(plugin.skillsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith(".") || (!entry.isDirectory() && !entry.isSymbolicLink())) {
        continue
      }

      const skillRoot = resolveSymlinkPath(join(plugin.skillsDir, entry.name))
      const skillMarkdownPath = join(skillRoot, "SKILL.md")
      if (!existsSync(skillMarkdownPath)) {
        continue
      }

      const { data, body } = readMarkdownInstruction<MarkdownInstructionFrontmatter>(skillMarkdownPath)
      const skillName = data.name || entry.name
      const namespacedName = `${plugin.name}:${skillName}`

      skills[namespacedName] = {
        name: namespacedName,
        description: `(plugin: ${plugin.name} - Skill) ${data.description ?? ""}`.trim(),
        template: `<skill-instruction>\nBase directory for this skill: ${skillRoot}/\n\n${body}\n</skill-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`,
        agent: data.agent,
        model: data.model,
        subtask: data.subtask,
        argumentHint: data["argument-hint"],
        location: skillRoot,
      }
    }
  }

  return skills
}
