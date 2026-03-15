import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { mergeClaudeCompatConfig } from "./merge-config"

describe("mergeClaudeCompatConfig", () => {
  it("deep merges claude_code and unions disabled collections", () => {
    const merged = mergeClaudeCompatConfig(
      {
        disabled_agents: ["alpha"],
        disabled_skills: ["one"],
        claude_code: {
          plugins: true,
          plugins_override: {
            "demo@market": true,
          },
        },
      },
      {
        disabled_agents: ["beta", "alpha"],
        disabled_skills: ["two"],
        claude_code: {
          skills: false,
          plugins_override: {
            "demo@market": false,
          },
        },
      },
    )

    assert.deepEqual(merged.disabled_agents, ["alpha", "beta"])
    assert.deepEqual(merged.disabled_skills, ["one", "two"])
    assert.equal(merged.claude_code?.plugins, true)
    assert.equal(merged.claude_code?.skills, false)
    assert.deepEqual(merged.claude_code?.plugins_override, {
      "demo@market": false,
    })
  })
})
