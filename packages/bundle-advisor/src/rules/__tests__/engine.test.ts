import { describe, expect, it, vi } from 'vitest'
import type { Issue, NormalizedBundle } from '../../types.js'
import { RuleEngine } from '../index.js'

describe('RuleEngine', () => {
  it('should run registered rules', () => {
    const engine = new RuleEngine()
    const fakeRule1 = vi.fn().mockReturnValue([])
    const fakeRule2 = vi.fn().mockReturnValue([
      {
        id: 'issue-1',
        ruleId: 'huge-modules',
        description: 'Fake issue for testing',
        severity: 'high',
        title: 'Huge Module Detected',
        bytesEstimate: 100000,
        fixType: 'replace-package',
      } as Issue,
    ])
    engine.register(fakeRule1)
    engine.register(fakeRule2)

    const bundle: NormalizedBundle = {
      assets: new Map(),
      packages: new Map(),
      modules: new Map([
        [
          '0',
          {
            id: '0',
            size: 250000,
            chunks: ['main'],
            packageName: 'huge-lib',
            path: 'node_modules/huge-lib/index.js',
            isVendor: true,
          },
        ],
      ]),
      chunks: new Map([
        [
          'main',
          {
            id: 'main',
            name: 'main',
            size: 250000,
            modules: ['0'],
            entryPoints: ['main'],
            isInitial: true,
          },
        ],
      ]),
    }

    const issues = engine.run(bundle)

    expect(issues.length).toBeGreaterThan(0)
    const hugeModuleIssue = issues.find(i => i.ruleId === 'huge-modules')
    expect(hugeModuleIssue).toBeDefined()
  })
})
