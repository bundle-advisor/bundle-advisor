import type { AnalysisInput, Chunk, Module } from '../types.js'
import type { IStatsAdapter } from './types.js'

/**
 * Bundle-stats format structure (used by Vite/webpack plugins)
 */
type BundleStatsFormat = {
  modules?: Array<{
    key: string
    runs: Array<{
      name: string
      value: number
      chunkIds?: string[]
    }>
  }>
  assets?: Array<{
    key: string
    runs: Array<{
      name: string
      value: number
      isEntry?: boolean
      isInitial?: boolean
      isChunk?: boolean
      chunkId?: string
    }>
  }>
  packages?: Array<{
    key: string
    runs: Array<{
      name: string
      path?: string
      value: number
    }>
  }>
  rawData?: Array<{
    webpack?: {
      chunks?: Array<{
        id: string
        name?: string
      }>
    }
  }>
}

/**
 * Adapter for bundle-stats.json format (Vite/webpack bundle-stats plugin)
 */
export class RollupPluginBundleStatsAdapter implements IStatsAdapter {
  canHandle(_filePath: string, raw: unknown): boolean {
    const stats = raw as BundleStatsFormat
    // Check if it has the bundle-stats structure
    return !!(
      stats &&
      (stats.modules || stats.assets || stats.packages) &&
      Array.isArray(stats.modules)
    )
  }

  toAnalysisInput(raw: unknown): AnalysisInput {
    const stats = raw as BundleStatsFormat

    const modules: Module[] = []
    const chunks: Chunk[] = []

    // Build chunk map from rawData if available
    const chunkMap = new Map<string, { id: string; name?: string }>()
    if (stats.rawData?.[0]?.webpack?.chunks) {
      for (const chunk of stats.rawData[0].webpack.chunks) {
        chunkMap.set(chunk.id, chunk)
      }
    }

    // Build package lookup map for version extraction
    const packageMap = new Map<string, { name: string; path?: string; value: number }>()
    if (stats.packages) {
      for (const pkg of stats.packages) {
        if (pkg.runs?.[0]) {
          packageMap.set(pkg.runs[0].name, pkg.runs[0])
        }
      }
    }

    // Process modules
    const moduleMap = new Map<string, Module>()
    if (stats.modules) {
      for (const mod of stats.modules) {
        if (!mod.runs || !mod.runs[0]) continue

        const run = mod.runs[0]
        const moduleId = mod.key
        const modulePath = run.name

        const { packageName, packageVersion, isVendor } = this.extractPackageInfo(modulePath)

        const module: Module = {
          id: moduleId,
          path: modulePath,
          size: run.value || 0,
          chunks: run.chunkIds || [],
          packageName,
          packageVersion,
          isVendor,
        }

        moduleMap.set(moduleId, module)
        modules.push(module)
      }
    }

    // Process assets to build chunks
    const chunkModuleMap = new Map<string, string[]>()
    if (stats.assets) {
      for (const asset of stats.assets) {
        if (!asset.runs || !asset.runs[0]) continue

        const run = asset.runs[0]
        if (!run.isChunk || !run.chunkId) continue

        const chunkId = run.chunkId
        const chunkInfo = chunkMap.get(chunkId)

        // Collect modules for this chunk
        const chunkModules: string[] = []
        for (const [moduleId, module] of moduleMap.entries()) {
          if (module.chunks.includes(chunkId)) {
            chunkModules.push(moduleId)
          }
        }

        chunkModuleMap.set(chunkId, chunkModules)

        const chunk: Chunk = {
          id: chunkId,
          size: run.value || 0,
          modules: chunkModules,
          entryPoints: chunkInfo?.name ? [chunkInfo.name] : [],
          isInitial: run.isInitial || run.isEntry || false,
        }

        chunks.push(chunk)
      }
    }

    // Update module chunks references to ensure consistency
    for (const module of modules) {
      // Filter out any chunk IDs that don't exist in our chunk list
      const validChunkIds = module.chunks.filter(chunkId => chunks.some(c => c.id === chunkId))
      module.chunks = validChunkIds
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

    // Extract package name and version from pnpm-style path
    // Example: ../../node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/...
    // Example: ../../node_modules/.pnpm/scheduler@0.23.2/node_modules/scheduler/...
    // Example: ../../node_modules/.pnpm/@babel+core@7.23.0_@babel+types@7.23.0/node_modules/@babel/core/...
    const pnpmMatch = modulePath.match(
      /node_modules\/\.pnpm\/((?:@[^+]+\+[^@]+)|(?:[^@]+))@([^/_]+)/,
    )

    if (pnpmMatch) {
      // Convert + back to / for scoped packages
      const packageName = pnpmMatch[1]?.replace(/\+/g, '/')
      return {
        packageName,
        packageVersion: pnpmMatch[2]?.split('_')[0], // Remove any peer dep info
        isVendor: true,
      }
    }

    // Try standard node_modules path
    // Example: ./node_modules/react/index.js
    // Example: ./node_modules/@babel/core/lib/index.js
    const nodeModulesMatch = modulePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)

    if (nodeModulesMatch) {
      return {
        packageName: nodeModulesMatch[1],
        isVendor: true,
      }
    }

    return { isVendor: true }
  }
}
