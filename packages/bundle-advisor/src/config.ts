import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Configuration for bundle-advisor
 */
export type BundleAdvisorConfig = {
  statsFile?: string
  outputDir?: string
  reporters?: {
    html?: boolean
    json?: boolean
    markdown?: boolean
  }
  rules?: {
    maxChunkSize?: number
    maxModuleSize?: number
    minLazyLoadThreshold?: number
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<BundleAdvisorConfig> = {
  statsFile: resolve(process.cwd(), 'stats.json'),
  reporters: { markdown: true },
  outputDir: resolve(process.cwd(), 'bundle-advisor'),
  rules: {
    maxChunkSize: 250 * 1024, // 250KB
    maxModuleSize: 200 * 1024, // 200KB
    minLazyLoadThreshold: 100 * 1024, // 100KB
  },
}

/**
 * Load configuration from bundle-advisor.config.json if it exists
 * @param cwd Current working directory to search for config file
 * @returns Merged configuration with defaults
 */
export function loadConfig(cwd: string = process.cwd()): BundleAdvisorConfig {
  const configPath = resolve(cwd, 'bundle-advisor.config.json')

  if (!existsSync(configPath)) {
    return {}
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent) as BundleAdvisorConfig

    return config
  } catch (error) {
    console.error(
      `Warning: Failed to parse bundle-advisor.config.json: ${error instanceof Error ? error.message : error}`,
    )
    return {}
  }
}

/**
 * Merge configuration from multiple sources (config file < CLI args)
 * CLI arguments take precedence over config file
 */
export function mergeConfig(
  fileConfig: BundleAdvisorConfig,
  cliConfig: BundleAdvisorConfig,
): Required<BundleAdvisorConfig> {
  return {
    statsFile: cliConfig.statsFile ?? fileConfig.statsFile ?? DEFAULT_CONFIG.statsFile,
    reporters: cliConfig.reporters ?? fileConfig.reporters ?? DEFAULT_CONFIG.reporters,
    outputDir: cliConfig.outputDir ?? fileConfig.outputDir ?? DEFAULT_CONFIG.outputDir,
    rules: {
      maxChunkSize:
        cliConfig.rules?.maxChunkSize ??
        fileConfig.rules?.maxChunkSize ??
        DEFAULT_CONFIG.rules.maxChunkSize,
      maxModuleSize:
        cliConfig.rules?.maxModuleSize ??
        fileConfig.rules?.maxModuleSize ??
        DEFAULT_CONFIG.rules.maxModuleSize,
      minLazyLoadThreshold:
        cliConfig.rules?.minLazyLoadThreshold ??
        fileConfig.rules?.minLazyLoadThreshold ??
        DEFAULT_CONFIG.rules.minLazyLoadThreshold,
    },
  }
}
