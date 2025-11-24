import { describe, expect, it } from 'vitest'
import type { BundleAnalysis } from '../../types.js'
import { generateJsonReport, generateMarkdownReport } from '../index.js'

describe('Report Generators', () => {
  const sampleReport: BundleAnalysis = {
    stats: {
      totalAssetsSize: 500000,
      initialChunksSize: 300000,
    },
    assets: new Map(),
    packages: new Map(),
    modules: new Map([
      [
        '0',
        {
          id: '0',
          size: 100000,
          path: 'src/index.js',
          chunks: ['main'],
          isVendor: false,
        },
      ],
    ]),
    chunks: new Map([
      [
        'main',
        {
          id: 'main',
          name: 'main',
          size: 300000,
          modules: ['0'],
          entryPoints: ['main'],
          isInitial: true,
        },
      ],
    ]),
    issues: [
      {
        id: 'test-issue-1',
        ruleId: 'test-rule',
        severity: 'high',
        title: 'Test Issue',
        description: 'This is a test issue',
        bytesEstimate: 50000,
        affectedModules: ['0'],
        fixType: 'other',
        metadata: {},
      },
    ],
  }

  it('should generate JSON report', () => {
    const json = generateJsonReport(sampleReport)
    const parsed = JSON.parse(json)

    expect(parsed.stats).toBeDefined()
    expect(parsed.modules).toBeDefined()
    expect(parsed.chunks).toBeDefined()
    expect(parsed.packages).toBeDefined()
    expect(parsed.assets).toBeDefined()
    expect(parsed.issues).toBeDefined()
    expect(parsed.issues.length).toBe(1)
  })

  it('should generate Markdown report', () => {
    const markdown = generateMarkdownReport(sampleReport)

    expect(markdown).toContain('# Bundle Analysis Report')
    expect(markdown).toContain('## Overview')
    expect(markdown).toContain('## High Priority Issues')
    expect(markdown).toContain('Test Issue')
  })

  it('should handle report with no issues', () => {
    const emptyReport: BundleAnalysis = {
      ...sampleReport,
      issues: [],
    }

    const markdown = generateMarkdownReport(emptyReport)

    expect(markdown).toContain('## No Issues Found')
  })
})
