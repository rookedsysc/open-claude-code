import type { Plugin } from "@opencode-ai/plugin"

import { createClaudeCompatConfigHandler } from "./plugin/config-handler"

const ClaudeCompatPlugin: Plugin = async (ctx) => {
  return {
    config: createClaudeCompatConfigHandler({
      directory: ctx.directory,
    }),
  }
}

export default ClaudeCompatPlugin
