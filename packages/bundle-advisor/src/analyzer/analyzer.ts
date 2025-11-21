import type { IStatsAdapter } from '../adapters/types.js'
import type { Analysis, AnalysisInput, DuplicatePackage, Module } from '../types.js'

/**
 * Core analyzer that processes normalized input and builds Analysis
 */
export class Analyzer {
  constructor(private adapter: IStatsAdapter) {}

  /**
   * Analyze raw stats using the configured adapter
   */
  analyze(rawStats: unknown): Analysis {
    const input = this.adapter.toAnalysisInput(rawStats)
    return this.buildAnalysis(input)
  }

  /**
   * Build Analysis from normalized AnalysisInput
   */
  private buildAnalysis(input: AnalysisInput): Analysis {
    const { modules, chunks } = input

    // Calculate total and initial sizes
    let totalSize = 0
    let initialSize = 0

    for (const chunk of chunks) {
      totalSize += chunk.size
      if (chunk.isInitial) {
        initialSize += chunk.size
      }
    }

    // Find duplicate packages
    const duplicatePackages = this.findDuplicatePackages(modules)

    // Find large modules (> 100KB)
    const LARGE_MODULE_THRESHOLD = 100 * 1024 // 100KB
    const largeModules = modules.filter(mod => mod.size > LARGE_MODULE_THRESHOLD)

    return {
      totalSize,
      initialSize,
      modules,
      chunks,
      duplicatePackages,
      largeModules,
    }
  }

  /**
   * Find packages that appear multiple times with different versions
   */
  private findDuplicatePackages(modules: Module[]): DuplicatePackage[] {
    const packageMap = new Map<string, { versions: Set<string>; totalSize: number }>()

    // Group modules by package name
    for (const mod of modules) {
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

    return duplicates
  }
}
