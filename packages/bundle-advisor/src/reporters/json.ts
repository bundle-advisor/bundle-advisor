import type { AIEnhancedReport, RawReport } from '../types.js'

/**
 * Generate a JSON report
 */
export function generateJsonReport(report: RawReport | AIEnhancedReport): string {
  return JSON.stringify(report, null, 2)
}
