import type { Analysis, Issue } from '../types.js'
import { formatBytes, generateIssueId } from './engine.js'

const RULE_ID = 'large-vendor-chunks'
const LARGE_CHUNK_THRESHOLD = 250 * 1024 // 250KB

/**
 * Rule: Detect large vendor chunks that could be split
 */
export function ruleLargeVendorChunks(analysis: Analysis): Issue[] {
  const issues: Issue[] = []

  for (const chunk of analysis.chunks) {
    if (chunk.size <= LARGE_CHUNK_THRESHOLD) continue

    // Check if chunk contains mostly vendor code
    const chunkModules = analysis.modules.filter(m => m.chunks.includes(chunk.id))
    const vendorModules = chunkModules.filter(m => m.isVendor)

    const vendorRatio = vendorModules.length / chunkModules.length

    if (vendorRatio > 0.7) {
      // More than 70% vendor code
      const vendorSize = vendorModules.reduce((sum, m) => sum + m.size, 0)

      issues.push({
        id: generateIssueId(RULE_ID, chunk.id),
        ruleId: RULE_ID,
        severity: chunk.isInitial ? 'high' : 'medium',
        title: `Large vendor chunk: ${chunk.id}`,
        description: `Chunk "${chunk.id}" contains ${formatBytes(vendorSize)} of vendor code (${formatBytes(chunk.size)} total). Consider code splitting to improve load performance${chunk.isInitial ? ' (this is an initial chunk)' : ''}.`,
        bytesEstimate: chunk.size,
        affectedModules: vendorModules.map(m => m.id),
        fixType: 'split-chunk',
        metadata: {
          chunkId: chunk.id,
          chunkSize: chunk.size,
          vendorSize,
          isInitial: chunk.isInitial,
        },
      })
    }
  }

  return issues
}
