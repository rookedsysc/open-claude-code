import type { LoadedCommandDefinition, LoadedSkillDefinition } from "../plugins/types"

export interface InvokeSkillOptions {
  skills: Record<string, LoadedSkillDefinition>
  commands: Record<string, LoadedCommandDefinition>
}

export interface InvokedInstruction {
  kind: "skill" | "command"
  name: string
  content: string
}

function replaceArguments(template: string, userMessage?: string): string {
  return template.replace("$ARGUMENTS", userMessage ?? "")
}

function findByName<T extends { name: string }>(
  record: Record<string, T>,
  requestedName: string,
): T | undefined {
  const normalized = requestedName.replace(/^\//, "").toLowerCase()
  return Object.values(record).find((entry) => entry.name.toLowerCase() === normalized)
}

export function invokeSkill(
  name: string,
  userMessage: string | undefined,
  options: InvokeSkillOptions,
): InvokedInstruction {
  const matchedSkill = findByName(options.skills, name)
  if (matchedSkill) {
    return {
      kind: "skill",
      name: matchedSkill.name,
      content: replaceArguments(matchedSkill.template, userMessage),
    }
  }

  const matchedCommand = findByName(options.commands, name)
  if (matchedCommand) {
    return {
      kind: "command",
      name: matchedCommand.name,
      content: replaceArguments(matchedCommand.template, userMessage),
    }
  }

  throw new Error(`Skill or command "${name}" not found`)
}
