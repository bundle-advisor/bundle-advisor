import { describe, expect, it } from 'vitest'
import rawInput from '../../__fixtures__/rollup-bundle-stats/with-duplicate-packages.json' with {
  type: 'json',
}
import { RollupBundleStatsAdapter } from '../../adapters/rollup-bundle-stats.js'
import type { NormalizedBundle } from '../../types.js'
import { createDuplicatePackagesRule } from '../index.js'

describe('duplicatePackagesRule', () => {
  it('should detect trivial duplicate packages', () => {
    const bundle: NormalizedBundle = {
      assets: new Map(),
      chunks: new Map(),
      packages: new Map([
        [
          'react:react-dom',
          {
            name: 'react-dom@16.0.0',
            version: '16.0.0',
            key: 'react:react-dom',
            path: 'node_modules/react-dom@16.0.0',
            displayName: 'react-dom',
            size: 100,
          },
        ],
        [
          'react:react-dom~1',
          {
            name: 'react-dom@17.0.0',
            version: '17.0.0',
            key: 'react:react-dom',
            path: 'node_modules/react-dom@17.0.0',
            displayName: 'react-dom',
            size: 100,
          },
        ],
      ]),
      modules: new Map([
        [
          '0',
          {
            id: '0',
            size: 150,
            chunks: ['main'],
            packageName: 'react-dom',
            packageVersion: '16.0.0',
            path: 'node_modules/react-dom/index.js',
            isVendor: true,
          },
        ],
        [
          '1',
          {
            id: '1',
            size: 150,
            chunks: ['other'],
            packageName: 'react-dom',
            packageVersion: '17.0.0',
            path: 'node_modules/react-dom/index.js',
            isVendor: true,
          },
        ],
      ]),
    }

    const issues = createDuplicatePackagesRule()(bundle)

    expect(issues.length).toBe(1)
    expect(issues[0]?.ruleId).toBe('duplicate-packages')
    expect(issues[0]?.severity).toBe('high')
    expect(issues[0]?.affectedModules).toEqual(['0', '1'])
    expect(issues[0]?.bytesEstimate).toBe(300)
  })

  it('should detect duplicate packages from rollup stats', () => {
    const adapter = new RollupBundleStatsAdapter()
    const bundle = adapter.toNormalizedBundle(rawInput)
    const issues = createDuplicatePackagesRule()(bundle)
    const duplicatePkgIssues = issues.filter(issue => issue.ruleId === 'duplicate-packages')

    expect(duplicatePkgIssues.length).toBe(3)
    expect(duplicatePkgIssues).toEqual([
      expect.objectContaining({
        ruleId: 'duplicate-packages',
        bytesEstimate: 2924 + 3194,
        fixType: 'dedupe-package',
        title: 'Duplicate package: @bufteam/cfacorp_core.bufbuild_es',
        metadata: {
          packageName: '@bufteam/cfacorp_core.bufbuild_es',
          totalSize: 2924 + 3194,
          versions: ['2.9.0-20250128201619-eba7fe9b2018.1', '2.6.1-20250128201619-eba7fe9b2018.1'],
        },
      }),
      expect.objectContaining({
        ruleId: 'duplicate-packages',
        bytesEstimate: 1738 + 1420,
        fixType: 'dedupe-package',
        title: 'Duplicate package: tslib',
        metadata: {
          packageName: 'tslib',
          totalSize: 1738 + 1420,
          versions: ['2.6.2', '2.8.1'],
        },
      }),
      expect.objectContaining({
        ruleId: 'duplicate-packages',
        title: 'Duplicate package: @bufteam/googleapis_googleapis.bufbuild_es',
        bytesEstimate: 958 + 956,
        fixType: 'dedupe-package',
        metadata: {
          packageName: '@bufteam/googleapis_googleapis.bufbuild_es',
          totalSize: 958 + 956,
          versions: ['2.6.1-20250411204039-52dc849cb1b3.1', '2.9.0-20250203204840-c4fc18c5274f.1'],
        },
      }),
    ])
  })
})
