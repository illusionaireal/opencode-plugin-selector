/**
 * Plugin discovery - finds available OpenCode plugins from multiple sources
 */

import { readdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import type { PluginInfo } from './types.js'
import { getActivePlugins, stripVersion } from './config.js'

const CACHE_DIR = join(homedir(), '.cache', 'opencode', 'node_modules')

/**
 * Known plugins from the OpenCode ecosystem
 * Sourced from https://opencode.ai/docs/ecosystem/
 */
const KNOWN_PLUGINS: Array<{ name: string; description: string }> = [
  { name: 'opencode-daytona', description: 'Run sessions in isolated Daytona sandboxes with git sync' },
  { name: 'opencode-helicone-session', description: 'Inject Helicone session headers for request grouping' },
  { name: 'opencode-type-inject', description: 'Auto-inject TypeScript/Svelte types into file reads' },
  { name: 'opencode-openai-codex-auth', description: 'Use ChatGPT Plus/Pro subscription instead of API credits' },
  { name: 'opencode-gemini-auth', description: 'Use existing Gemini plan instead of API billing' },
  { name: 'opencode-antigravity-auth', description: 'Use Antigravity free models instead of API billing' },
  { name: 'opencode-devcontainers', description: 'Multi-branch devcontainer isolation with shallow clones' },
  { name: 'opencode-google-antigravity-auth', description: 'Google Antigravity OAuth with Google Search support' },
  { name: 'opencode-dynamic-context-pruning', description: 'Optimize token usage by pruning obsolete tool outputs' },
  { name: 'opencode-vibeguard', description: 'Redact secrets/PII into VibeGuard placeholders before LLM calls' },
  { name: 'opencode-websearch-cited', description: 'Native websearch with Google grounded style citations' },
  { name: 'opencode-pty', description: 'Run background processes in a PTY with interactive input' },
  { name: 'opencode-shell-strategy', description: 'Instructions for non-interactive shell commands' },
  { name: 'opencode-wakatime', description: 'Track OpenCode usage with Wakatime' },
  { name: 'opencode-md-table-formatter', description: 'Clean up markdown tables produced by LLMs' },
  { name: 'opencode-morph-plugin', description: 'Fast Apply editing, WarpGrep search, context compaction' },
  { name: 'oh-my-opencode', description: 'Background agents, LSP/AST/MCP tools, Claude Code compatible' },
  { name: 'opencode-notificator', description: 'Desktop notifications and sound alerts for sessions' },
  { name: 'opencode-notifier', description: 'Notifications for permission, completion, error events' },
  { name: 'opencode-zellij-namer', description: 'AI-powered Zellij session naming from context' },
  { name: 'opencode-skillful', description: 'Lazy load prompts on demand with skill discovery' },
  { name: 'opencode-supermemory', description: 'Persistent memory across sessions via Supermemory' },
  { name: 'plannotator-opencode', description: 'Interactive plan review with visual annotation' },
  { name: 'openspoon-subtask2', description: 'Extend /commands into orchestration with flow control' },
  { name: 'opencode-scheduler', description: 'Schedule recurring jobs with cron syntax (launchd/systemd)' },
  { name: 'micode', description: 'Structured Brainstorm-Plan-Implement workflow with continuity' },
  { name: 'octto', description: 'Interactive browser UI for AI brainstorming' },
  { name: 'opencode-background-agents', description: 'Claude Code-style background agents with async delegation' },
  { name: 'opencode-notify', description: 'Native OS notifications for task completion' },
  { name: 'opencode-workspace', description: 'Multi-agent orchestration harness - 16 components' },
  { name: 'opencode-worktree', description: 'Zero-friction git worktrees for OpenCode' },
  { name: 'opencode-sentry-monitor', description: 'Trace and debug AI agents with Sentry' },
  { name: 'opencode-firecrawl', description: 'Web scraping, crawling, and search via Firecrawl' }
]

/**
 * Get installed plugins from cache directory
 */
export async function getInstalledPlugins(): Promise<Set<string>> {
  try {
    const dirs = await readdir(CACHE_DIR)
    return new Set(dirs)
  } catch {
    return new Set()
  }
}

/**
 * Search npm for additional OpenCode plugins
 * Returns plugin names
 */
export async function searchNpmPlugins(): Promise<string[]> {
  try {
    // Use Bun's shell API or spawn process to run npm search
    const proc = Bun.spawn(['npm', 'search', 'opencode-plugin', '--json'])
    const text = await new Response(proc.stdout).text()
    await proc.exited
    
    if (text) {
      const results = JSON.parse(text)
      return results.map((pkg: any) => pkg.name)
    }
  } catch (error) {
    // Silently fail - npm search is optional enhancement
  }
  return []
}

/**
 * Get all available plugins with their status
 */
export async function getAllPlugins(): Promise<PluginInfo[]> {
  const [installed, activeList] = await Promise.all([
    getInstalledPlugins(),
    getActivePlugins()
  ])
  
  const activeSet = new Set(activeList.map(stripVersion))
  
  // Start with known plugins
  const plugins: PluginInfo[] = KNOWN_PLUGINS.map(p => ({
    name: p.name,
    description: p.description,
    installed: installed.has(p.name),
    active: activeSet.has(p.name)
  }))
  
  // Add any additional plugins from npm search (in background, non-blocking)
  // For now, we'll skip this to keep the UI fast
  // Could be added as an async enhancement later
  
  return plugins
}
