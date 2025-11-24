import { describe, expect, it } from 'vitest'
import rawStats from '../../__fixtures__/rollup-bundle-stats/with-momentjs.json' with {
  type: 'json',
}
import { RollupBundleStatsAdapter } from '../rollup-bundle-stats.js'

describe('RollupPluginBundleStatsAdapter', () => {
  it('should detect rollup bundle stats', () => {
    const adapter = new RollupBundleStatsAdapter()

    expect(adapter.canHandle('stats.json', rawStats)).toBe(true)
  })

  it('should convert rollup bundle stats to a NormalizedBundle', () => {
    const adapter = new RollupBundleStatsAdapter()

    const bundle = adapter.toNormalizedBundle(rawStats)
    expect(bundle.chunks.size).toBe(4)
    expect(bundle.assets.size).toBe(7)
    expect(bundle.packages.size).toBe(7)
    expect(bundle.modules.size).toBe(41)

    const home = bundle.modules.get('./app/routes/home.tsx')
    expect(home).toBeDefined()
    expect(home?.size).toBe(258)
    expect(home?.chunks).toEqual(['73e8398'])
  })
})
