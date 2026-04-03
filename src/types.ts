/**
 * Type definitions for opencode-plugin-selector
 */

/**
 * Plugin metadata
 */
export interface PluginInfo {
  name: string
  description: string
  installed: boolean
  active: boolean
}

/**
 * OpenCode configuration structure
 */
export interface OpenCodeConfig {
  $schema?: string
  plugin?: string[]
  [key: string]: any
}

/**
 * Plugin context provided by OpenCode
 */
export interface PluginContext {
  project: any
  client: any
  $: any
  directory: string
  worktree: string
}

/**
 * Plugin hooks
 */
export interface PluginHooks {
  [event: string]: (input: any, output: any) => Promise<void> | void
}

/**
 * Plugin function signature
 */
export type PluginFunction = (ctx: PluginContext) => Promise<PluginHooks>

/**
 * TUI command input
 */
export interface TUICommandInput {
  command: string
  args: string[]
}

/**
 * TUI command output
 */
export interface TUICommandOutput {
  result?: any
  error?: Error
}
