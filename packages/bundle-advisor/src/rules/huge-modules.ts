import type { Issue } from '../types.js'
import { formatBytes, generateIssueId, type Rule } from './engine.js'

const RULE_ID = 'huge-modules'

export type HugeModulesRuleConfig = {
  maxModuleSize?: number
}

/**
 * Rule: Detect individual modules that are unusually large
 */
export const createHugeModulesRule =
  (config?: HugeModulesRuleConfig): Rule =>
  analysis => {
    const MAX_SIZE = config?.maxModuleSize ?? 200 * 1024 // 200KB
    const issues: Issue[] = []

    for (const mod of analysis.modules.values()) {
      if (mod.size <= MAX_SIZE) continue

      const severity = mod.size > MAX_SIZE * 2 ? 'high' : 'medium'

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
