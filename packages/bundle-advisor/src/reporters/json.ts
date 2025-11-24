import type { AIEnhancedBundleAnalysis, BundleAnalysis } from '../types.js'

/**
 * Generate a JSON report
 */
export function generateJsonReport(analysis: BundleAnalysis | AIEnhancedBundleAnalysis): string {
  return JSON.stringify(analysis, null, 2)
}
