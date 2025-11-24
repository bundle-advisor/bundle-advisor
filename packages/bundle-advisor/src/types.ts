/**
 * Represents a JavaScript module file in the bundle
 */
export interface Module {
  /** bundler-specific ID / path */
  id: string
  /** file path if resolvable */
  path: string
  /** original size in bytes */
  size: number
  /** IDs of chunks containing this module */
  chunks: string[]
  /** npm package name if known */
  packageName?: string
  /** npm package version if known */
  packageVersion?: string
  /** whether this module is considered vendor code */
  isVendor: boolean
}

/**
 * Represents a downloadable file loaded in the browser,
 * such as a JS bundle, CSS, image, etc.
 */
export interface Asset {
  /** A normalized key removing the hash from the asset file name */
  key: string
  /** Build-specific name for the assset, including cache-busting hash */
  name: string
  /** A normalized name for the asset to display in reporting */
  displayName: string
  /** Size in bytes after bundler optimizations */
  size: number
  /** Formatted size to show in reporters, i.e. "12.3 KB" */
  displaySize: string
  /** Indicates if the asset was marked as an entry-point by the bundler */
  isEntry: boolean
  /**
   * Indicates if the chunk is downloaded during initial page load
   * and is required for the page to become interactive.
   * Must be true if {@link isEntry} is true.
   */
  isInitial: boolean
  /**
   * Indicates the asset is part of a logical bundle group
   * including JS and associated CSS
   */
  isChunk: boolean
  /** Must be defined when the asset is a JavaScript chunk */
  chunkId?: string
}

/**
 * A term borrowed from webpack representing a group of modules
 * that are bundled together into a single output file.
 */
export interface Chunk {
  /** Unique ID for the chunk */
  id: string
  /** Human-readable name for the chunk if available */
  name: string
  /** Size in bytes */
  size: number
  /** A list of module IDs included in this chunk */
  modules: string[]
  /** A list of assets names included in this chunk */
  entryPoints: string[]
  /**
   * Indicates if the chunk is downloaded during initial page load
   * and is required for the page to become interactive
   */
  isInitial: boolean
}

/**
 * Represents an npm package included in the bundle
 */
export interface Package {
  /** A normalized key based on the package name and version */
  key: string
  /** Published name of the package */
  name: string
  /** A normalized name for the package to display in reporting */
  displayName: string
  /** Resolved path to the package root if available */
  path: string
  /** Installed version of the package */
  version: string
  /**
   * The total package's module size in bytes (source or transformed)
   * before any production optimization (module hoisting, tree-shaking, minification, etc.)
   */
  size: number
}

/**
 * Normalized representation of a bundler's output generated from adapters
 */
export interface NormalizedBundle {
  assets: Map<string, Asset>
  packages: Map<string, Package>
  modules: Map<string, Module>
  chunks: Map<string, Chunk>
}

export type IssueSeverity = 'low' | 'medium' | 'high'

export type FixType =
  | 'replace-package'
  | 'split-chunk'
  | 'lazy-load-module'
  | 'dedupe-package'
  | 'optimize-imports'
  | 'other'

/**
 * Represents an actionable issue found in the bundle analysis
 */
export interface Issue {
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

/**
 * Represents an issue enhanced with AI metadata
 */
export type AIEnhancedIssue = Issue & {
  impactScore?: number // 0..1
  effortScore?: number // 0..1
  priorityScore?: number // 0..1
  aiNotes?: string
}

/**
 * Top-level metrics about the bundler output
 */
export interface BundleStats {
  totalAssetsSize: number
  initialChunksSize: number
}

/**
 * Complete analysis of a bundler's output,
 * including normalized bundle data, stats, and issues
 */
export interface BundleAnalysis extends NormalizedBundle {
  stats: BundleStats
  issues: Issue[]
}

/**
 * Bundle analysis enhanced with AI-generated summary and recommendations
 */
export interface AIEnhancedBundleAnalysis extends BundleAnalysis {
  issues: AIEnhancedIssue[]
  aiSummary?: string
  aiTopRecommendations?: string[]
}
