import { describe, expect, it } from 'vitest'
import { type BundleAdvisorConfig, DEFAULT_CONFIG, loadConfig, mergeConfig } from '../config.js'

describe('Config', () => {
  it('should load default config when no file exists', () => {
    const config = loadConfig('/nonexistent/path')
    expect(config).toEqual({})
  })

  it('should merge configs correctly with CLI taking precedence', () => {
    const fileConfig: BundleAdvisorConfig = {
      reporters: { json: true },
      outputDir: 'file-output',
      statsFile: 'file-stats.json',
      rules: {
        maxChunkSize: 256000,
        maxModuleSize: 256000,
      },
    }

    const cliConfig: BundleAdvisorConfig = {
      reporters: { markdown: true },
      statsFile: 'cli-stats.json',
    }

    const merged = mergeConfig(fileConfig, cliConfig)

    expect(merged.reporters).toEqual({ markdown: true }) // CLI wins
    expect(merged.statsFile).toBe('cli-stats.json') // CLI wins
    expect(merged.outputDir).toBe('file-output') // from file
    expect(merged.rules.maxChunkSize).toBe(256000) // from file
    expect(merged.rules.maxModuleSize).toBe(256000) // from file
    expect(merged.rules.minLazyLoadThreshold).toBe(DEFAULT_CONFIG.rules.minLazyLoadThreshold) // default
  })

  it('should use defaults when neither file nor CLI provides values', () => {
    const merged = mergeConfig({}, {})

    expect(merged.reporters).toBe(DEFAULT_CONFIG.reporters)
    expect(merged.outputDir).toBe(DEFAULT_CONFIG.outputDir)
    expect(merged.statsFile).toBe(DEFAULT_CONFIG.statsFile)
    expect(merged.rules.maxChunkSize).toBe(DEFAULT_CONFIG.rules.maxChunkSize)
    expect(merged.rules.maxModuleSize).toBe(DEFAULT_CONFIG.rules.maxModuleSize)
    expect(merged.rules.minLazyLoadThreshold).toBe(DEFAULT_CONFIG.rules.minLazyLoadThreshold)
  })
})
