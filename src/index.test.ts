import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { ClaudeCompatConfig } from "./types"

describe("claude-compat package", () => {
  it("exposes base types", () => {
    const config: ClaudeCompatConfig = {
      claude_code: {
        plugins: true,
      },
    }

    assert.equal(config.claude_code?.plugins, true)
  })
})
