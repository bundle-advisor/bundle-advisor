import type { Analysis, Issue } from '../types.js'
import { formatBytes, generateIssueId } from './engine.js'

const RULE_ID = 'huge-modules'
const HUGE_MODULE_THRESHOLD = 200 * 1024 // 200KB

/**
 * Rule: Detect individual modules that are unusually large
 */
export function ruleHugeModules(analysis: Analysis): Issue[] {
  const issues: Issue[] = []

  for (const mod of analysis.modules) {
    if (mod.size <= HUGE_MODULE_THRESHOLD) continue

    const severity = mod.size > 500 * 1024 ? 'high' : 'medium'

    issues.push({
      id: generateIssueId(RULE_ID, mod.id),
      ruleId: RULE_ID,
      severity,
      title: `Huge module: ${mod.packageName || mod.path || mod.id}`,
      description: `Module "${mod.packageName || mod.path || mod.id}" is ${formatBytes(mod.size)}. Consider replacing with a lighter alternative, tree-shaking unused code, or lazy loading this module.`,
      bytesEstimate: mod.size,
      affectedModules: [mod.id],
      fixType: mod.packageName ? 'replace-package' : 'optimize-imports',
      metadata: {
        moduleId: mod.id,
        modulePath: mod.path,
        packageName: mod.packageName,
        size: mod.size,
      },
    })
  }

  return issues
}
