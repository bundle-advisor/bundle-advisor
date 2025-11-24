import type { NormalizedBundle } from '../types.js'
import type { StatsAdapter } from './types.js'

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
export class WebpackStatsAdapter implements StatsAdapter {
  canHandle(_filePath: string, raw: unknown): boolean {
    // Check if it looks like webpack stats
    const stats = raw as WebpackStats
    return !!(stats && (stats.chunks || stats.modules || stats.assets))
  }

  toNormalizedBundle(_raw: unknown): NormalizedBundle {
    throw new Error('WebpackStatsAdapter.toBundleStats not yet implemented')
    // const stats = raw as WebpackStats

    // const modules: Module[] = []
    // const chunks: Chunk[] = []

    // // Build module map
    // const moduleMap = new Map<string, Module>()

    // if (stats.modules) {
    //   for (const mod of stats.modules) {
    //     const moduleId = String(mod.id)
    //     const modulePath = mod.name || moduleId

    //     // Extract package name from node_modules path
    //     const { packageName, packageVersion, isVendor } = this.extractPackageInfo(modulePath)

    //     const module: Module = {
    //       id: moduleId,
    //       path: modulePath,
    //       size: mod.size || 0,
    //       chunks: (mod.chunks || []).map(String),
    //       packageName,
    //       packageVersion,
    //       isVendor,
    //     }

    //     moduleMap.set(moduleId, module)
    //     modules.push(module)
    //   }
    // }

    // // Build chunks
    // if (stats.chunks) {
    //   for (const chunk of stats.chunks) {
    //     const chunkId = String(chunk.id)
    //     const chunkModules: string[] = []

    //     // Process chunk modules
    //     if (chunk.modules) {
    //       for (const mod of chunk.modules) {
    //         const moduleId = String(mod.id)
    //         chunkModules.push(moduleId)

    //         // If module not in moduleMap, add it
    //         if (!moduleMap.has(moduleId)) {
    //           const modulePath = mod.name || moduleId
    //           const { packageName, packageVersion, isVendor } = this.extractPackageInfo(modulePath)

    //           const module: Module = {
    //             id: moduleId,
    //             path: modulePath,
    //             size: mod.size || 0,
    //             chunks: [chunkId],
    //             packageName,
    //             packageVersion,
    //             isVendor,
    //           }

    //           moduleMap.set(moduleId, module)
    //           modules.push(module)
    //         } else {
    //           // Update chunks list
    //           const existingModule = moduleMap.get(moduleId)
    //           if (existingModule && !existingModule.chunks.includes(chunkId)) {
    //             existingModule.chunks.push(chunkId)
    //           }
    //         }
    //       }
    //     }

    //     const chunkObj: Chunk = {
    //       id: chunkId,
    //       size: chunk.size || 0,
    //       modules: chunkModules,
    //       entryPoints: chunk.names || [],
    //       isInitial: chunk.initial || chunk.entry || false,
    //     }

    //     chunks.push(chunkObj)
    //   }
    // }

    // return {
    //   modules: Array.from(moduleMap.values()),
    //   chunks,
    // }
  }
}
