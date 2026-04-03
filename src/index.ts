/**
 * opencode-plugin-selector
 * Interactive plugin selector for OpenCode
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { PluginContext, PluginHooks, PluginInfo } from './types.js'
import { getAllPlugins } from './discovery.js'
import { updatePlugins, stripVersion, getActivePlugins } from './config.js'

/**
 * Main plugin export
 */
export const PluginSelector = async (ctx: PluginContext): Promise<PluginHooks> => {
  return {
    /**
     * Handle TUI command execution
     * Triggers on /plugins command
     */
    'tui.command.execute': async (input, output) => {
      if (input.command === 'plugins') {
        await handlePluginsCommand(ctx)
      }
    }
  }
}

/**
 * Handle the /plugins command
 */
async function handlePluginsCommand(ctx: PluginContext): Promise<void> {
  console.clear()
  
  p.intro(pc.bgCyan(pc.black(' OpenCode Plugin Selector ')))
  
  const spinner = p.spinner()
  spinner.start('Loading plugins...')
  
  try {
    // Get all plugins with their status
    const plugins = await getAllPlugins()
    
    spinner.stop(`Found ${plugins.length} plugins`)
    
    // Build options for multiselect
    const options = plugins.map(p => ({
      value: p.name,
      label: `${p.name} ${p.installed ? pc.green('✓') : pc.red('✗')}`,
      hint: p.description
    }))
    
    // Get currently active plugins
    const activePlugins = await getActivePlugins()
    const initialValues = activePlugins.map(stripVersion)
    
    // Show interactive selector
    const selected = await p.multiselect({
      message: 'Select plugins to enable (Space to toggle, Enter to confirm):',
      options,
      initialValues
    })
    
    if (p.isCancel(selected)) {
      p.outro(pc.yellow('Cancelled'))
      return
    }
    
    // Update configuration
    spinner.start('Updating configuration...')
    
    await updatePlugins(selected as string[])
    
    spinner.stop('Configuration updated')
    
    // Show summary
    const enabledCount = (selected as string[]).length
    p.outro(pc.green(`✓ ${enabledCount} plugins enabled`))
    
    // Show what changed
    const enabled = selected as string[]
    const previouslyActive = new Set(initialValues)
    
    const newlyEnabled = enabled.filter(n => !previouslyActive.has(n))
    const newlyDisabled = initialValues.filter(n => !enabled.includes(n))
    
    if (newlyEnabled.length > 0) {
      console.log(pc.green('\nEnabled:'))
      newlyEnabled.forEach(n => console.log(pc.green(`  + ${n}`)))
    }
    
    if (newlyDisabled.length > 0) {
      console.log(pc.red('\nDisabled:'))
      newlyDisabled.forEach(n => console.log(pc.red(`  - ${n}`)))
    }
    
    // Suggest restart
    console.log(pc.dim('\nRestart OpenCode to apply changes.'))
    
  } catch (error) {
    spinner.stop('Failed')
    p.outro(pc.red(`Error: ${(error as Error).message}`))
    
    // Log error via OpenCode client
    await ctx.client.app.log({
      body: {
        service: 'plugin-selector',
        level: 'error',
        message: 'Failed to load plugins',
        extra: { error: (error as Error).message }
      }
    })
  }
}

// Default export for OpenCode plugin system
export default PluginSelector
