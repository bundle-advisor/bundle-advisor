import { describe, expect, it } from 'vitest'
import stats from '../../__fixtures__/rollup-bundle-stats/with-momentjs.json' with { type: 'json' }
import { RollupBundleStatsAdapter } from '../../adapters/rollup-bundle-stats.js'
import { RuleEngine } from '../../rules/engine.js'
import { Analyzer } from '../analyzer.js'

describe('Analyzer', () => {
  it('should analyze rollup bundle stats', () => {
    const adapter = new RollupBundleStatsAdapter()
    const engine = new RuleEngine()
    const analyzer = new Analyzer(adapter, engine)

    const analysis = analyzer.analyze(stats)

    expect(analysis.stats.totalAssetsSize).toBe(397820)
    expect(analysis.stats.initialChunksSize).toBe(377861)
    expect(analysis.modules.size).toBe(41)
    expect(analysis.chunks.size).toBe(4)
  })
})
