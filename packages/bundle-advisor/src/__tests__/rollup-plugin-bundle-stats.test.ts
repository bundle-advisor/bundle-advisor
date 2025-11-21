import { describe, expect, it } from 'vitest'
import { RollupPluginBundleStatsAdapter } from '../adapters/rollup-plugin-bundle-stats.js'

describe('RollupPluginBundleStatsAdapter', () => {
  it('should detect bundle-stats format', () => {
    const adapter = new RollupPluginBundleStatsAdapter()
    const stats = {
      modules: [],
      assets: [],
      packages: [],
    }

    expect(adapter.canHandle('bundle-stats.json', stats)).toBe(true)
  })

  it('should convert bundle-stats to AnalysisInput', () => {
    const adapter = new RollupPluginBundleStatsAdapter()
    const stats = {
      modules: [
        {
          key: 'module-1',
          runs: [
            {
              name: './src/index.ts',
              value: 5000,
              chunkIds: ['chunk-1'],
            },
          ],
        },
        {
          key: 'module-2',
          runs: [
            {
              name: '../../node_modules/.pnpm/react@18.3.1/node_modules/react/index.js',
              value: 80000,
              chunkIds: ['chunk-1'],
            },
          ],
        },
      ],
      assets: [
        {
          key: 'entry.js',
          runs: [
            {
              name: 'entry.js',
              value: 85000,
              isEntry: true,
              isInitial: true,
              isChunk: true,
              chunkId: 'chunk-1',
            },
          ],
        },
      ],
      rawData: [
        {
          webpack: {
            chunks: [
              {
                id: 'chunk-1',
                name: 'entry',
              },
            ],
          },
        },
      ],
    }

    const result = adapter.toAnalysisInput(stats)

    expect(result.modules).toHaveLength(2)
    expect(result.chunks).toHaveLength(1)

    const reactModule = result.modules.find(m => m.path?.includes('react/index.js'))
    expect(reactModule).toBeDefined()
    expect(reactModule?.isVendor).toBe(true)
    expect(reactModule?.packageName).toBe('react')
    expect(reactModule?.packageVersion).toBe('18.3.1')

    const appModule = result.modules.find(m => m.path === './src/index.ts')
    expect(appModule).toBeDefined()
    expect(appModule?.isVendor).toBe(false)

    const chunk = result.chunks[0]
    expect(chunk?.id).toBe('chunk-1')
    expect(chunk?.isInitial).toBe(true)
    expect(chunk?.modules).toHaveLength(2)
  })

  it('should extract package version from pnpm paths', () => {
    const adapter = new RollupPluginBundleStatsAdapter()
    const stats = {
      modules: [
        {
          key: 'module-1',
          runs: [
            {
              name: '../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js',
              value: 50000,
              chunkIds: ['chunk-1'],
            },
          ],
        },
        {
          key: 'module-2',
          runs: [
            {
              name: '../../node_modules/.pnpm/@babel+core@7.23.0_@babel+types@7.23.0/node_modules/@babel/core/index.js',
              value: 30000,
              chunkIds: ['chunk-1'],
            },
          ],
        },
      ],
      assets: [
        {
          key: 'chunk-1.js',
          runs: [
            {
              name: 'chunk-1.js',
              value: 80000,
              isChunk: true,
              chunkId: 'chunk-1',
              isInitial: false,
            },
          ],
        },
      ],
    }

    const result = adapter.toAnalysisInput(stats)

    const lodashModule = result.modules.find(m => m.path?.includes('lodash'))
    expect(lodashModule?.packageName).toBe('lodash')
    expect(lodashModule?.packageVersion).toBe('4.17.21')

    const babelModule = result.modules.find(m => m.path?.includes('@babel'))
    expect(babelModule?.packageName).toBe('@babel/core')
    expect(babelModule?.packageVersion).toBe('7.23.0')
  })
})
