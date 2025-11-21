import { describe, expect, it } from 'vitest'
import { WebpackStatsAdapter } from '../adapters/webpack-stats.js'

describe('WebpackStatsAdapter', () => {
  it('should detect webpack stats', () => {
    const adapter = new WebpackStatsAdapter()
    const stats = {
      chunks: [],
      modules: [],
    }

    expect(adapter.canHandle('stats.json', stats)).toBe(true)
  })

  it('should convert webpack stats to AnalysisInput', () => {
    const adapter = new WebpackStatsAdapter()
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
            {
              id: '1',
              name: './node_modules/react/index.js',
              size: 50000,
            },
          ],
        },
      ],
      modules: [
        {
          id: '0',
          name: './src/index.js',
          size: 50000,
          chunks: ['main'],
        },
        {
          id: '1',
          name: './node_modules/react/index.js',
          size: 50000,
          chunks: ['main'],
        },
      ],
    }

    const result = adapter.toAnalysisInput(stats)

    expect(result.modules).toHaveLength(2)
    expect(result.chunks).toHaveLength(1)

    const reactModule = result.modules.find(m => m.packageName === 'react')
    expect(reactModule).toBeDefined()
    expect(reactModule?.isVendor).toBe(true)

    const appModule = result.modules.find(m => m.path === './src/index.js')
    expect(appModule).toBeDefined()
    expect(appModule?.isVendor).toBe(false)
  })
})
