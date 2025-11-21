import { describe, expect, it } from 'vitest'
import { RuleEngine, ruleDuplicatePackages, ruleHugeModules } from '../rules/index.js'
import type { Analysis } from '../types.js'

describe('RuleEngine', () => {
  it('should run registered rules', () => {
    const engine = new RuleEngine()
    engine.register(ruleDuplicatePackages)
    engine.register(ruleHugeModules)

    const analysis: Analysis = {
      totalSize: 100000,
      initialSize: 100000,
      modules: [
        {
          id: '0',
          size: 250000,
          chunks: ['main'],
          packageName: 'huge-lib',
          isVendor: true,
        },
      ],
      chunks: [
        {
          id: 'main',
          size: 250000,
          modules: ['0'],
          entryPoints: ['main'],
          isInitial: true,
        },
      ],
      duplicatePackages: [],
      largeModules: [
        {
          id: '0',
          size: 250000,
          chunks: ['main'],
          packageName: 'huge-lib',
          isVendor: true,
        },
      ],
    }

    const issues = engine.run(analysis)

    expect(issues.length).toBeGreaterThan(0)
    const hugeModuleIssue = issues.find(i => i.ruleId === 'huge-modules')
    expect(hugeModuleIssue).toBeDefined()
  })
})

describe('ruleDuplicatePackages', () => {
  it('should detect duplicate packages', () => {
    const analysis: Analysis = {
      totalSize: 100000,
      initialSize: 100000,
      modules: [],
      chunks: [],
      duplicatePackages: [
        {
          packageName: 'react',
          versions: ['16.0.0', '17.0.0'],
          totalSize: 100000,
        },
      ],
      largeModules: [],
    }

    const issues = ruleDuplicatePackages(analysis)

    expect(issues.length).toBe(1)
    expect(issues[0]?.ruleId).toBe('duplicate-packages')
    expect(issues[0]?.severity).toBe('high')
  })
})
