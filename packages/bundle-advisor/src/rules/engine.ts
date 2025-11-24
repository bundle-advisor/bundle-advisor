import type { Issue, NormalizedBundle } from '../types.js'

/**
 * A rule is a function that analyzes the bundle and returns issues
 */
export type Rule = (stats: NormalizedBundle) => Issue[]

/**
 * Rule engine that runs all registered rules
 */
export class RuleEngine {
  private rules: Rule[] = []

  /**
   * Register a rule
   */
  register(rule: Rule): void {
    this.rules.push(rule)
  }

  /**
   * Run all registered rules
   */
  run(stats: NormalizedBundle): Issue[] {
    return this.rules.flatMap(rule => rule(stats))
  }
}

/**
 * Helper to generate unique issue IDs
 */
export function generateIssueId(ruleId: string, suffix: string): string {
  return `${ruleId}:${suffix}`
}

/**
 * Helper to format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
