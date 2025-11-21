/**
 * Core data types for bundle analysis
 */

export type Module = {
  id: string // bundler-specific ID / path
  path?: string // file path if resolvable
  size: number // bytes (parsed or gzip, depending on adapter)
  chunks: string[] // IDs of chunks containing this module
  packageName?: string // npm package name if known
  packageVersion?: string
  isVendor: boolean
}

export type Chunk = {
  id: string
  size: number
  modules: string[] // module IDs
  entryPoints: string[] // entry / route names using this chunk
  isInitial: boolean // part of initial load
}

export type DuplicatePackage = {
  packageName: string
  versions: string[]
  totalSize: number
}

export type Analysis = {
  totalSize: number
  initialSize: number
  modules: Module[]
  chunks: Chunk[]
  duplicatePackages: DuplicatePackage[]
  largeModules: Module[]
}

export type IssueSeverity = 'low' | 'medium' | 'high'

export type FixType =
  | 'replace-package'
  | 'split-chunk'
  | 'lazy-load-module'
  | 'dedupe-package'
  | 'optimize-imports'
  | 'other'

export type Issue = {
  id: string
  ruleId: string
  severity: IssueSeverity
  title: string
  description: string
  bytesEstimate?: number
  affectedModules: string[] // module IDs
  fixType: FixType
  metadata: Record<string, unknown>
}

export type AIRankedIssue = Issue & {
  impactScore?: number // 0..1
  effortScore?: number // 0..1
  priorityScore?: number // 0..1
  aiNotes?: string
}

export type RawReport = {
  analysis: Analysis
  issues: Issue[]
}

export type AIEnhancedReport = {
  analysis: Analysis
  issues: AIRankedIssue[]
  aiSummary?: string
  aiTopRecommendations?: string[]
}

/**
 * Normalized input structure from adapters
 */
export type AnalysisInput = {
  modules: Module[]
  chunks: Chunk[]
}
