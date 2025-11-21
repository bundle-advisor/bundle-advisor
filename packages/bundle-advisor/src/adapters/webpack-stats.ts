import type { AnalysisInput, Chunk, Module } from '../types.js'
import type { IStatsAdapter } from './types.js'

/**
 * Webpack stats.json structure (simplified)
 */
type WebpackStats = {
  assets?: Array<{
    name: string
    size: number
  }>
  chunks?: Array<{
    id: string | number
    initial: boolean
    entry: boolean
    names?: string[]
    size: number
    modules?: Array<{
      id: string | number
      name: string
      size: number
    }>
  }>
  modules?: Array<{
    id: string | number
    name: string
    size: number
    chunks?: Array<string | number>
  }>
}

/**
 * Adapter for Webpack stats.json files
 */
export class WebpackStatsAdapter implements IStatsAdapter {
  canHandle(_filePath: string, raw: unknown): boolean {
    // Check if it looks like webpack stats
    const stats = raw as WebpackStats
    return !!(stats && (stats.chunks || stats.modules || stats.assets))
  }

  toAnalysisInput(raw: unknown): AnalysisInput {
    const stats = raw as WebpackStats

    const modules: Module[] = []
    const chunks: Chunk[] = []

    // Build module map
    const moduleMap = new Map<string, Module>()

    if (stats.modules) {
      for (const mod of stats.modules) {
        const moduleId = String(mod.id)
        const modulePath = mod.name || moduleId

        // Extract package name from node_modules path
        const { packageName, packageVersion, isVendor } = this.extractPackageInfo(modulePath)

        const module: Module = {
          id: moduleId,
          path: modulePath,
          size: mod.size || 0,
          chunks: (mod.chunks || []).map(String),
          packageName,
          packageVersion,
          isVendor,
        }

        moduleMap.set(moduleId, module)
        modules.push(module)
      }
    }

    // Build chunks
    if (stats.chunks) {
      for (const chunk of stats.chunks) {
        const chunkId = String(chunk.id)
        const chunkModules: string[] = []

        // Process chunk modules
        if (chunk.modules) {
          for (const mod of chunk.modules) {
            const moduleId = String(mod.id)
            chunkModules.push(moduleId)

            // If module not in moduleMap, add it
            if (!moduleMap.has(moduleId)) {
              const modulePath = mod.name || moduleId
              const { packageName, packageVersion, isVendor } = this.extractPackageInfo(modulePath)

              const module: Module = {
                id: moduleId,
                path: modulePath,
                size: mod.size || 0,
                chunks: [chunkId],
                packageName,
                packageVersion,
                isVendor,
              }

              moduleMap.set(moduleId, module)
              modules.push(module)
            } else {
              // Update chunks list
              const existingModule = moduleMap.get(moduleId)
              if (existingModule && !existingModule.chunks.includes(chunkId)) {
                existingModule.chunks.push(chunkId)
              }
            }
          }
        }

        const chunkObj: Chunk = {
          id: chunkId,
          size: chunk.size || 0,
          modules: chunkModules,
          entryPoints: chunk.names || [],
          isInitial: chunk.initial || chunk.entry || false,
        }

        chunks.push(chunkObj)
      }
    }

    return {
      modules: Array.from(moduleMap.values()),
      chunks,
    }
  }

  /**
   * Extract package information from a module path
   */
  private extractPackageInfo(modulePath: string): {
    packageName?: string
    packageVersion?: string
    isVendor: boolean
  } {
    const isVendor = modulePath.includes('node_modules')

    if (!isVendor) {
      return { isVendor: false }
    }

    // Extract package name from node_modules path
    // Example: ./node_modules/react/index.js -> react
    // Example: ./node_modules/@babel/core/lib/index.js -> @babel/core
    const nodeModulesMatch = modulePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)

    if (nodeModulesMatch) {
      const packageName = nodeModulesMatch[1]
      return {
        packageName,
        isVendor: true,
      }
    }

    return { isVendor: true }
  }
}
