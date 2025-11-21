import type { Analysis, Issue } from '../types.js'
import { formatBytes, generateIssueId } from './engine.js'

const RULE_ID = 'duplicate-packages'

/**
 * Rule: Detect duplicate packages with different versions
 */
export function ruleDuplicatePackages(analysis: Analysis): Issue[] {
  const issues: Issue[] = []

  for (const dup of analysis.duplicatePackages) {
    issues.push({
      id: generateIssueId(RULE_ID, dup.packageName),
      ruleId: RULE_ID,
      severity: 'high',
      title: `Duplicate package: ${dup.packageName}`,
      description: `The package "${dup.packageName}" appears ${dup.versions.length} times with different versions: ${dup.versions.join(', ')}. Total size: ${formatBytes(dup.totalSize)}. Consider using a single version to reduce bundle size.`,
      bytesEstimate: dup.totalSize,
      affectedModules: analysis.modules
        .filter(m => m.packageName === dup.packageName)
        .map(m => m.id),
      fixType: 'dedupe-package',
      metadata: {
        packageName: dup.packageName,
        versions: dup.versions,
        totalSize: dup.totalSize,
      },
    })
  }

  return issues
}
