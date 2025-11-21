import { formatBytes } from '../rules/engine.js'
import type { AIEnhancedReport, RawReport } from '../types.js'

/**
 * Generate a JSON report
 */
export function generateJsonReport(report: RawReport | AIEnhancedReport): string {
  return JSON.stringify(report, null, 2)
}

/**
 * Generate a Markdown report
 */
export function generateMarkdownReport(report: RawReport | AIEnhancedReport): string {
  const { analysis, issues } = report

  const lines: string[] = []

  // Header
  lines.push('# Bundle Analysis Report')
  lines.push('')

  // Overview
  lines.push('## Overview')
  lines.push('')
  lines.push(`- **Total Size**: ${formatBytes(analysis.totalSize)}`)
  lines.push(`- **Initial Load Size**: ${formatBytes(analysis.initialSize)}`)
  lines.push(`- **Lazy Load Size**: ${formatBytes(analysis.totalSize - analysis.initialSize)}`)
  lines.push(`- **Total Modules**: ${analysis.modules.length}`)
  lines.push(`- **Total Chunks**: ${analysis.chunks.length}`)
  lines.push('')

  // Potential savings
  let potentialSavings = 0
  for (const issue of issues) {
    potentialSavings += issue.bytesEstimate || 0
  }
  if (potentialSavings > 0) {
    lines.push(`**Potential Savings**: ${formatBytes(potentialSavings)} (estimated)`)
    lines.push('')
  }

  // AI Summary (if available)
  const aiReport = report as AIEnhancedReport
  if (aiReport.aiSummary) {
    lines.push('## AI Summary')
    lines.push('')
    lines.push(aiReport.aiSummary)
    lines.push('')
  }

  // Top Recommendations (if available)
  if (aiReport.aiTopRecommendations && aiReport.aiTopRecommendations.length > 0) {
    lines.push('## Top Recommendations')
    lines.push('')
    for (let i = 0; i < aiReport.aiTopRecommendations.length; i++) {
      lines.push(`${i + 1}. ${aiReport.aiTopRecommendations[i]}`)
    }
    lines.push('')
  }

  // Issues by severity
  const highIssues = issues.filter(i => i.severity === 'high')
  const mediumIssues = issues.filter(i => i.severity === 'medium')
  const lowIssues = issues.filter(i => i.severity === 'low')

  if (highIssues.length > 0) {
    lines.push('## High Priority Issues')
    lines.push('')
    for (const issue of highIssues) {
      lines.push(`### ${issue.title}`)
      lines.push('')
      lines.push(issue.description)
      lines.push('')
      if (issue.bytesEstimate) {
        lines.push(`**Estimated Impact**: ${formatBytes(issue.bytesEstimate)}`)
      }
      lines.push(`**Fix Type**: ${issue.fixType}`)
      if ('aiNotes' in issue && issue.aiNotes) {
        lines.push('')
        lines.push(`**AI Notes**: ${issue.aiNotes}`)
      }
      lines.push('')
    }
  }

  if (mediumIssues.length > 0) {
    lines.push('## Medium Priority Issues')
    lines.push('')
    for (const issue of mediumIssues) {
      lines.push(`### ${issue.title}`)
      lines.push('')
      lines.push(issue.description)
      lines.push('')
      if (issue.bytesEstimate) {
        lines.push(`**Estimated Impact**: ${formatBytes(issue.bytesEstimate)}`)
      }
      lines.push(`**Fix Type**: ${issue.fixType}`)
      if ('aiNotes' in issue && issue.aiNotes) {
        lines.push('')
        lines.push(`**AI Notes**: ${issue.aiNotes}`)
      }
      lines.push('')
    }
  }

  if (lowIssues.length > 0) {
    lines.push('## Low Priority Issues')
    lines.push('')
    for (const issue of lowIssues) {
      lines.push(`### ${issue.title}`)
      lines.push('')
      lines.push(issue.description)
      lines.push('')
      if (issue.bytesEstimate) {
        lines.push(`**Estimated Impact**: ${formatBytes(issue.bytesEstimate)}`)
      }
      lines.push(`**Fix Type**: ${issue.fixType}`)
      if ('aiNotes' in issue && issue.aiNotes) {
        lines.push('')
        lines.push(`**AI Notes**: ${issue.aiNotes}`)
      }
      lines.push('')
    }
  }

  // No issues
  if (issues.length === 0) {
    lines.push('## No Issues Found')
    lines.push('')
    lines.push('Great! No optimization opportunities were detected in your bundle.')
    lines.push('')
  }

  return lines.join('\n')
}
