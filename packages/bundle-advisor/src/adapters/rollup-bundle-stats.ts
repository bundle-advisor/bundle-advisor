import type { Asset, Chunk, Module, NormalizedBundle, Package } from '../types.js'
import type { StatsAdapter } from './types.js'
import { extractPackageVersion } from './utils.js'

/**
 * Bundle-stats format structure (used by Vite/webpack plugins)
 */
type BundleStatsFormat = {
  modules?: Array<{
    key: string
    label?: string
    runs: Array<{
      name: string
      value: number
      chunkIds?: string[]
      originalValue?: number
      displayValue?: string
    }>
  }>
  assets?: Array<{
    key: string
    label?: string
    runs: Array<{
      name: string
      value: number
      isEntry?: boolean
      isInitial?: boolean
      isChunk?: boolean
      chunkId?: string
      displayValue?: string
    }>
  }>
  packages?: Array<{
    key: string
    label: string
    runs: Array<{
      name: string
      path: string
      value: number
      displayValue?: string
    }>
  }>
  runs?: Array<{
    internalBuildNumber?: number
    webpack?: {
      chunks?: Array<{
        id: string
        name: string
      }>
    }
  }>
}

/**
 * Adapter for bundle-stats.json format (Vite/webpack bundle-stats plugin)
 */
export class RollupBundleStatsAdapter implements StatsAdapter {
  canHandle(_filePath: string, raw: unknown): boolean {
    const stats = raw as BundleStatsFormat
    // Check if it has the bundle-stats structure
    return !!(
      stats &&
      (stats.modules || stats.assets || stats.packages) &&
      Array.isArray(stats.modules)
    )
  }

  toNormalizedBundle(raw: unknown): NormalizedBundle {
    const stats = raw as BundleStatsFormat

    // Build package lookup map for version extraction
    const packageMap = new Map<string, Package>()
    for (const { key, label, runs } of stats?.packages ?? []) {
      const lastRun = runs[runs.length - 1]
      if (!lastRun) {
        continue
      }

      // This is wrong and overwrites packages
      const version = extractPackageVersion(lastRun.path)
      packageMap.set(key, {
        key,
        name: lastRun.name,
        displayName: label,
        path: lastRun.path,
        size: lastRun.value,
        version: version || 'unknown',
      })
    }

    // Process modules
    const moduleMap = new Map<string, Module>()
    for (const mod of stats?.modules ?? []) {
      if (!mod.runs || !mod.runs[0]) continue

      const run = mod.runs[0]
      const moduleId = mod.key
      const modulePath = run.name

      // Find the package for this module if there is one
      const modulePackage = Array.from(packageMap.values()).find(pkg =>
        modulePath.startsWith(pkg.path),
      )

      moduleMap.set(moduleId, {
        id: moduleId,
        path: modulePath,
        size: run.value || 0,
        chunks: run.chunkIds || [],
        packageName: modulePackage?.name,
        packageVersion: modulePackage?.version,
        isVendor: !!modulePackage,
      })
    }

    // Process assets to build chunks
    const assetMap = new Map<string, Asset>()
    for (const { key, label, runs } of stats?.assets ?? []) {
      const lastRun = runs[runs.length - 1]
      if (!lastRun) {
        continue
      }

      assetMap.set(key, {
        key,
        name: lastRun.name,
        displayName: label ?? lastRun.name,
        size: lastRun.value,
        displaySize: lastRun.displayValue ?? `${lastRun.value} bytes`,
        isChunk: lastRun.isChunk ?? false,
        isEntry: lastRun.isEntry ?? false,
        isInitial: lastRun.isInitial ?? false,
        chunkId: lastRun.chunkId,
      })
    }

    // Build initial chunk map
    const chunkMap = new Map<string, Chunk>()
    for (const { id, name } of stats.runs?.[0]?.webpack?.chunks ?? []) {
      chunkMap.set(id, {
        id,
        name,
        size: 0,
        modules: [],
        entryPoints: [],
        isInitial: false,
      })
    }

    // Add modules to chunks
    for (const module of moduleMap.values()) {
      for (const chunkId of module.chunks) {
        const chunk = chunkMap.get(chunkId)
        if (chunk) {
          chunk.modules.push(module.id)
        }
      }
    }

    // Add entryPoints, size, and isInitial to chunks
    for (const asset of assetMap.values()) {
      if (!asset.isChunk || !asset.chunkId) {
        continue
      }

      const chunk = chunkMap.get(asset.chunkId)
      if (chunk) {
        chunk.size = asset.size

        if (asset.isEntry) {
          chunk.entryPoints.push(asset.name)
        }

        if (asset.isInitial) {
          chunk.isInitial = true
        }
      }
    }

    return {
      packages: packageMap,
      modules: moduleMap,
      assets: assetMap,
      chunks: chunkMap,
    }
  }
}
