import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

import { parseFrontmatter } from "../plugins/frontmatter"
import type { LoadedSkillDefinition, MarkdownInstructionFrontmatter } from "../plugins/types"

export interface LoadClaudeSkillsOptions {
  directory?: string
  claudeDir?: string
  maxDepth?: number
}

function getClaudeDir(claudeDir?: string): string {
  return claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude")
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.endsWith(".md")
}

function loadSkillFile(filePath: string, fallbackName: string, prefix = ""): LoadedSkillDefinition {
  const resolvedPath = realpathSync(filePath)
  const { data, body } = parseFrontmatter<MarkdownInstructionFrontmatter>(readFileSync(filePath, "utf-8"))
  const baseName = data.name || fallbackName
  const skillName = prefix ? `${prefix}/${baseName}` : baseName

  return {
    name: skillName,
    description: `(claude - Skill) ${data.description ?? ""}`.trim(),
    template: `<skill-instruction>\nBase directory for this skill: ${join(resolvedPath, "..")}\n\n${body.trim()}\n</skill-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`,
    agent: data.agent,
    model: data.model,
    subtask: data.subtask,
    argumentHint: data["argument-hint"],
    location: join(resolvedPath, ".."),
  }
}

function loadSkillsFromDir(
  skillsDir: string,
  prefix = "",
  depth = 0,
  maxDepth = 2,
  visited = new Set<string>(),
): Record<string, LoadedSkillDefinition> {
  if (!existsSync(skillsDir)) {
    return {}
  }

  const realPath = realpathSync(skillsDir)
  if (visited.has(realPath)) {
    return {}
  }
  visited.add(realPath)

  const skills: Record<string, LoadedSkillDefinition> = {}
  const entries = readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue
    }

    const entryPath = join(skillsDir, entry.name)
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      const resolvedPath = realpathSync(entryPath)
      const skillMarkdownPath = join(resolvedPath, "SKILL.md")
      const namedMarkdownPath = join(resolvedPath, `${entry.name}.md`)

      if (existsSync(skillMarkdownPath)) {
        const skill = loadSkillFile(skillMarkdownPath, entry.name, prefix)
        skills[skill.name] = skill
        continue
      }

      if (existsSync(namedMarkdownPath)) {
        const skill = loadSkillFile(namedMarkdownPath, entry.name, prefix)
        skills[skill.name] = skill
        continue
      }

      if (depth < maxDepth) {
        const nested = loadSkillsFromDir(
          resolvedPath,
          prefix ? `${prefix}/${entry.name}` : entry.name,
          depth + 1,
          maxDepth,
          visited,
        )
        Object.assign(skills, nested)
      }
      continue
    }

    if (!entry.isFile() || !isMarkdownFile(entry.name)) {
      continue
    }

    const fallbackName = basename(entry.name, ".md")
    const skill = loadSkillFile(entryPath, fallbackName, prefix)
    skills[skill.name] = skill
  }

  return skills
}

export function loadUserClaudeSkills(options: LoadClaudeSkillsOptions = {}): Record<string, LoadedSkillDefinition> {
  return loadSkillsFromDir(join(getClaudeDir(options.claudeDir), "skills"), "", 0, options.maxDepth ?? 2)
}

export function loadProjectClaudeSkills(options: LoadClaudeSkillsOptions = {}): Record<string, LoadedSkillDefinition> {
  return loadSkillsFromDir(join(options.directory ?? process.cwd(), ".claude", "skills"), "", 0, options.maxDepth ?? 2)
}
