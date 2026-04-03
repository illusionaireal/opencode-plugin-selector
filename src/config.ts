/**
 * Configuration file management for OpenCode
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import type { OpenCodeConfig } from './types.js'

const CONFIG_PATH = join(homedir(), '.config', 'opencode', 'opencode.json')

/**
 * Read OpenCode configuration file
 */
export async function readConfig(): Promise<OpenCodeConfig> {
  try {
    const content = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    // If file doesn't exist, return default config
    if ((error as any).code === 'ENOENT') {
      return { plugin: [] }
    }
    throw error
  }
}

/**
 * Write OpenCode configuration file
 */
export async function writeConfig(config: OpenCodeConfig): Promise<void> {
  const content = JSON.stringify(config, null, 2)
  await writeFile(CONFIG_PATH, content, 'utf-8')
}

/**
 * Get current active plugins from config
 */
export async function getActivePlugins(): Promise<string[]> {
  const config = await readConfig()
  return config.plugin || []
}

/**
 * Update plugin list in config
 * Preserves version specifiers for existing plugins
 */
export async function updatePlugins(selectedPlugins: string[]): Promise<void> {
  const config = await readConfig()
  
  // Build version map from existing plugins
  const versionMap = new Map<string, string>()
  if (config.plugin) {
    for (const p of config.plugin) {
      const name = stripVersion(p)
      versionMap.set(name, p)
    }
  }
  
  // Apply new selection with preserved versions
  config.plugin = selectedPlugins.map(name => {
    return versionMap.get(name) || name
  })
  
  await writeConfig(config)
}

/**
 * Strip version specifier from plugin name
 * @example 'plugin@1.0.0' -> 'plugin'
 */
export function stripVersion(name: string): string {
  return name.replace(/@.*$/, '')
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_PATH
}
