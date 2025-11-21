import { formatBytes, generateIssueId } from '../rules/index.js'
import type { Analysis, Issue } from '../types.js'

const RULE_ID = 'lazy-load-candidates'
const LAZY_LOAD_THRESHOLD = 100 * 1024 // 100KB

/**
 * Rule: Identify chunks that aren't lazy loaded but could be
 */
export function ruleLazyLoadCandidates(analysis: Analysis): Issue[] {
  const issues: Issue[] = []

  // Find initial chunks that could potentially be lazy loaded
  for (const chunk of analysis.chunks) {
    if (!chunk.isInitial || chunk.size <= LAZY_LOAD_THRESHOLD) continue

    // Skip the main entry chunk (no entry point names usually means it's the main bundle)
    if (chunk.entryPoints.length === 0) continue

    issues.push({
      id: generateIssueId(RULE_ID, chunk.id),
      ruleId: RULE_ID,
      severity: 'medium',
      title: `Lazy load candidate: ${chunk.entryPoints.join(', ')}`,
      description: `Entry point "${chunk.entryPoints.join(', ')}" (${formatBytes(chunk.size)}) is loaded initially. Consider lazy loading to reduce initial bundle size.`,
      bytesEstimate: chunk.size,
      affectedModules: chunk.modules,
      fixType: 'lazy-load-module',
      metadata: {
        chunkId: chunk.id,
        entryPoints: chunk.entryPoints,
        size: chunk.size,
      },
    })
  }

  return issues
}
