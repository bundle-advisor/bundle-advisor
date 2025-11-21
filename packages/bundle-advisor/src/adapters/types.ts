import type { AnalysisInput } from '../types.js'

/**
 * Interface for stats adapters that normalize bundler-specific stats
 * into a common AnalysisInput format
 */
export interface IStatsAdapter {
  /**
   * Check if this adapter can handle the given stats file
   */
  canHandle(filePath: string, raw: unknown): boolean

  /**
   * Convert bundler-specific stats to normalized AnalysisInput
   */
  toAnalysisInput(raw: unknown): AnalysisInput
}
