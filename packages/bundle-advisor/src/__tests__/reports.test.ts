import { describe, expect, it } from 'vitest'
import { generateJsonReport, generateMarkdownReport } from '../reports/generators.js'
import type { RawReport } from '../types.js'

describe('Report Generators', () => {
  const sampleReport: RawReport = {
    analysis: {
      totalSize: 500000,
      initialSize: 300000,
      modules: [
        {
          id: '0',
          size: 100000,
          chunks: ['main'],
          isVendor: false,
        },
      ],
      chunks: [
        {
          id: 'main',
          size: 300000,
          modules: ['0'],
          entryPoints: ['main'],
          isInitial: true,
        },
      ],
      duplicatePackages: [],
      largeModules: [],
    },
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

    expect(parsed.analysis).toBeDefined()
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
    const emptyReport: RawReport = {
      ...sampleReport,
      issues: [],
    }

    const markdown = generateMarkdownReport(emptyReport)

    expect(markdown).toContain('## No Issues Found')
  })
})
