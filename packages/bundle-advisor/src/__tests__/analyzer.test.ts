import { describe, expect, it } from 'vitest'
import { WebpackStatsAdapter } from '../adapters/webpack-stats.js'
import { Analyzer } from '../analyzer/analyzer.js'

describe('Analyzer', () => {
  it('should analyze webpack stats', () => {
    const adapter = new WebpackStatsAdapter()
    const analyzer = new Analyzer(adapter)

    const stats = {
      chunks: [
        {
          id: 'main',
          initial: true,
          entry: true,
          names: ['main'],
          size: 100000,
          modules: [
            {
              id: '0',
              name: './src/index.js',
              size: 50000,
            },
          ],
        },
        {
          id: 'vendor',
          initial: false,
          entry: false,
          names: ['vendor'],
          size: 200000,
          modules: [
            {
              id: '1',
              name: './node_modules/react/index.js',
              size: 200000,
            },
          ],
        },
      ],
    }

    const analysis = analyzer.analyze(stats)

    expect(analysis.totalSize).toBe(300000)
    expect(analysis.initialSize).toBe(100000)
    expect(analysis.modules.length).toBeGreaterThan(0)
    expect(analysis.chunks.length).toBe(2)
  })

  it('should identify large modules', () => {
    const adapter = new WebpackStatsAdapter()
    const analyzer = new Analyzer(adapter)

    const stats = {
      chunks: [
        {
          id: 'main',
          initial: true,
          size: 200000,
          modules: [
            {
              id: '0',
              name: './node_modules/lodash/index.js',
              size: 200000,
            },
          ],
        },
      ],
    }

    const analysis = analyzer.analyze(stats)

    expect(analysis.largeModules.length).toBeGreaterThan(0)
    expect(analysis.largeModules[0]?.packageName).toBe('lodash')
  })
})
