import { existsSync, readFileSync } from "node:fs"

import { parse, printParseErrorCode, type ParseError } from "jsonc-parser"

export function parseJsonc<T = unknown>(content: string): T {
  const errors: ParseError[] = []
  const result = parse(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as T

  if (errors.length > 0) {
    const message = errors
      .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ")
    throw new SyntaxError(`JSONC parse error: ${message}`)
  }

  return result
}

export function readJsoncFile<T = unknown>(filePath: string): T | null {
  try {
    return parseJsonc<T>(readFileSync(filePath, "utf-8"))
  } catch {
    return null
  }
}

export function detectConfigFile(basePath: string): {
  format: "json" | "jsonc" | "none"
  path: string
} {
  const jsoncPath = `${basePath}.jsonc`
  const jsonPath = `${basePath}.json`

  if (existsSync(jsoncPath)) {
    return { format: "jsonc", path: jsoncPath }
  }

  if (existsSync(jsonPath)) {
    return { format: "json", path: jsonPath }
  }

  return { format: "none", path: jsonPath }
}
