import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

import type {
  ClaudeSettings,
  DiscoverClaudePluginsOptions,
  DiscoverClaudePluginsResult,
  InstalledPluginsDatabase,
  LoadedPlugin,
  PluginInstallation,
  PluginLoadError,
  PluginManifest,
} from "./types"

function getClaudeDir(claudeDir?: string): string {
  return claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude")
}

function getPluginsBaseDir(claudeDir?: string): string {
  return join(getClaudeDir(claudeDir), "plugins")
}

function getInstalledPluginsPath(claudeDir?: string): string {
  return join(getPluginsBaseDir(claudeDir), "installed_plugins.json")
}

function getClaudeSettingsPath(claudeDir?: string): string {
  if (process.env.CLAUDE_SETTINGS_PATH) {
    return process.env.CLAUDE_SETTINGS_PATH
  }

  return join(getClaudeDir(claudeDir), "settings.json")
}

function loadInstalledPlugins(claudeDir?: string): InstalledPluginsDatabase | null {
  const dbPath = getInstalledPluginsPath(claudeDir)
  if (!existsSync(dbPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(dbPath, "utf-8")) as InstalledPluginsDatabase
  } catch {
    return null
  }
}

function loadClaudeSettings(claudeDir?: string): ClaudeSettings | null {
  const settingsPath = getClaudeSettingsPath(claudeDir)
  if (!existsSync(settingsPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(settingsPath, "utf-8")) as ClaudeSettings
  } catch {
    return null
  }
}

function loadPluginManifest(installPath: string): PluginManifest | null {
  const manifestPath = join(installPath, ".claude-plugin", "plugin.json")
  if (!existsSync(manifestPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8")) as PluginManifest
  } catch {
    return null
  }
}

function extractPluginEntries(
  db: InstalledPluginsDatabase,
): Array<[string, PluginInstallation | undefined]> {
  if (db.version === 1) {
    return Object.entries(db.plugins).map(([key, installation]) => [key, installation])
  }

  return Object.entries(db.plugins).map(([key, installations]) => [key, installations[0]])
}

function derivePluginNameFromKey(pluginKey: string): string {
  return pluginKey.split("@")[0] ?? pluginKey
}

function isPluginEnabled(
  pluginKey: string,
  settingsEnabledPlugins: Record<string, boolean> | undefined,
  overrideEnabledPlugins: Record<string, boolean> | undefined,
): boolean {
  if (overrideEnabledPlugins && pluginKey in overrideEnabledPlugins) {
    return overrideEnabledPlugins[pluginKey]
  }

  if (settingsEnabledPlugins && pluginKey in settingsEnabledPlugins) {
    return settingsEnabledPlugins[pluginKey]
  }

  return true
}

function resolveManifestPath(
  installPath: string,
  manifestValue: string | string[] | undefined,
  defaultRelativePath: string,
): string | undefined {
  const candidates = manifestValue === undefined
    ? [defaultRelativePath]
    : Array.isArray(manifestValue)
      ? manifestValue
      : [manifestValue]

  for (const candidate of candidates) {
    const resolvedPath = join(installPath, candidate)
    if (existsSync(resolvedPath)) {
      return resolvedPath
    }
  }

  return undefined
}

function resolveMcpPath(installPath: string, manifest?: PluginManifest): string | undefined {
  const manifestValue = manifest?.mcpServers
  if (typeof manifestValue === "string") {
    const resolvedPath = join(installPath, manifestValue)
    return existsSync(resolvedPath) ? resolvedPath : undefined
  }

  const defaultPath = join(installPath, ".mcp.json")
  return existsSync(defaultPath) ? defaultPath : undefined
}

export function discoverClaudePlugins(
  options: DiscoverClaudePluginsOptions = {},
): DiscoverClaudePluginsResult {
  const db = loadInstalledPlugins(options.claudeDir)
  const settings = loadClaudeSettings(options.claudeDir)
  const plugins: LoadedPlugin[] = []
  const errors: PluginLoadError[] = []

  if (!db?.plugins) {
    return { plugins, errors }
  }

  for (const [pluginKey, installation] of extractPluginEntries(db)) {
    if (!installation) {
      continue
    }

    if (!isPluginEnabled(pluginKey, settings?.enabledPlugins, options.enabledPluginsOverride)) {
      continue
    }

    if (!existsSync(installation.installPath)) {
      errors.push({
        pluginKey,
        installPath: installation.installPath,
        error: "Plugin installation path does not exist",
      })
      continue
    }

    const manifest = loadPluginManifest(installation.installPath)
    const pluginName = manifest?.name || derivePluginNameFromKey(pluginKey)

    plugins.push({
      name: pluginName,
      version: installation.version || manifest?.version || "unknown",
      scope: installation.scope,
      installPath: installation.installPath,
      pluginKey,
      manifest: manifest ?? undefined,
      commandsDir: resolveManifestPath(installation.installPath, manifest?.commands, "commands"),
      agentsDir: resolveManifestPath(installation.installPath, manifest?.agents, "agents"),
      skillsDir: resolveManifestPath(installation.installPath, manifest?.skills, "skills"),
      mcpPath: resolveMcpPath(installation.installPath, manifest ?? undefined),
    })
  }

  return { plugins, errors }
}
