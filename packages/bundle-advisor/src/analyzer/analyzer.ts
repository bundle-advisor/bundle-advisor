import type { StatsAdapter } from '../adapters/types.js'
import type { RuleEngine } from '../rules/engine.js'
import type { BundleAnalysis } from '../types.js'

/**
 * Core analyzer that processes normalized input and builds BundleReport
 */
export class Analyzer {
  constructor(
    private adapter: StatsAdapter,
    private engine: RuleEngine,
  ) {}

  /**
   * Analyze raw stats using the configured adapter
   */
  analyze(raw: unknown): BundleAnalysis {
    const bundle = this.adapter.toNormalizedBundle(raw)

    // Calculate total size of all assets
    let totalAssetsSize = 0
    for (const asset of bundle.assets.values()) {
      totalAssetsSize += asset.size
    }

    // Calculate initial size from chunks
    let initialChunksSize = 0
    for (const chunk of bundle.chunks.values()) {
      if (chunk.isInitial) {
        initialChunksSize += chunk.size
      }
    }

    const issues = this.engine.run(bundle)
    return {
      ...bundle,
      issues,
      stats: {
        totalAssetsSize,
        initialChunksSize,
      },
    }
  }
}
