import { discoverClaudePlugins } from "./discovery"
import { loadPluginAgents } from "./loaders/agent-loader"
import { loadPluginCommands } from "./loaders/command-loader"
import { loadPluginMcps } from "./loaders/mcp-loader"
import { loadPluginSkills } from "./loaders/skill-loader"
import type { DiscoverClaudePluginsOptions, LoadedPluginComponents } from "./types"

export function loadAllPluginComponents(
  options: DiscoverClaudePluginsOptions = {},
): LoadedPluginComponents {
  const discovery = discoverClaudePlugins(options)

  return {
    commands: loadPluginCommands(discovery.plugins),
    skills: loadPluginSkills(discovery.plugins),
    agents: loadPluginAgents(discovery.plugins),
    mcps: loadPluginMcps(discovery.plugins),
    plugins: discovery.plugins,
    errors: discovery.errors,
  }
}
