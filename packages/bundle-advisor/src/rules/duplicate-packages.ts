import type { Issue } from '../types.js'
import { formatBytes, generateIssueId, type Rule } from './engine.js'

const RULE_ID = 'duplicate-packages'

export interface DuplicatePackage {
  packageName: string
  versions: string[]
  totalSize: number
}

/**
 * Rule: Detect duplicate packages with different versions
 */
export const createDuplicatePackagesRule = (): Rule => bundleStats => {
  const packageMap = new Map<string, { versions: Set<string>; totalSize: number }>()

  // Group modules by package name
  for (const mod of bundleStats.modules.values()) {
    if (!mod.packageName) continue

    if (!packageMap.has(mod.packageName)) {
      packageMap.set(mod.packageName, {
        versions: new Set(),
        totalSize: 0,
      })
    }

    const pkg = packageMap.get(mod.packageName)
    if (pkg) {
      if (mod.packageVersion) {
        pkg.versions.add(mod.packageVersion)
      }
      pkg.totalSize += mod.size
    }
  }

  // Filter to only packages with multiple versions
  const duplicates: DuplicatePackage[] = []

  for (const [packageName, data] of packageMap.entries()) {
    if (data.versions.size > 1) {
      duplicates.push({
        packageName,
        versions: Array.from(data.versions),
        totalSize: data.totalSize,
      })
    }
  }

  // Sort by total size descending
  duplicates.sort((a, b) => b.totalSize - a.totalSize)

  const issues: Issue[] = []

  for (const dup of duplicates) {
    issues.push({
      id: generateIssueId(RULE_ID, dup.packageName),
      ruleId: RULE_ID,
      severity: 'high',
      title: `Duplicate package: ${dup.packageName}`,
      description: `The package "${dup.packageName}" appears ${dup.versions.length} times with different versions: ${dup.versions.join(', ')}. Total size: ${formatBytes(dup.totalSize)}. Consider using a single version to reduce bundle size.`,
      bytesEstimate: dup.totalSize,
      affectedModules: Array.from(bundleStats.modules.values())
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
