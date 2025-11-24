import type { NormalizedBundle } from '../types.js'

/**
 * Interface for stats adapters that normalize bundler-specific stats
 * into a common bundle format
 */
export interface StatsAdapter {
  /**
   * Check if this adapter can handle the given raw data
   */
  canHandle(filePath: string, raw: unknown): boolean

  /**
   * Convert bundler-specific stats to normalized bundle format
   */
  toNormalizedBundle(raw: unknown): NormalizedBundle
}
