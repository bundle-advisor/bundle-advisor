import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import createPlugin from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import Handlebars from 'handlebars'
import postcss from 'postcss'
import { formatBytes } from '../rules/engine.js'
import type { AIEnhancedBundleAnalysis, BundleAnalysis } from '../types.js'

const cssProcessor = postcss([autoprefixer, createPlugin()])
const css = readFileSync(resolve(__dirname, 'html-template.css'), 'utf-8')
const templateContent = readFileSync(resolve(__dirname, 'html-template.hbs'), 'utf-8')

export function generateHtmlReport(analysis: BundleAnalysis | AIEnhancedBundleAnalysis): string {
  const { chunks, modules, assets, packages, stats, issues } = analysis

  Handlebars.registerHelper('capitalize', (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  })

  Handlebars.registerHelper('formatBytes', (str: string) => formatBytes(Number.parseInt(str, 10)))

  const template = Handlebars.compile(templateContent)

  // Potential savings
  let potentialSavings = 0
  for (const issue of issues) {
    potentialSavings += issue.bytesEstimate || 0
  }

  return template({
    chunksSize: chunks.size,
    assetsSize: assets.size,
    modulesSize: modules.size,
    packagesSize: packages.size,
    stats,
    potentialSavings,
    aiSummary: (analysis as AIEnhancedBundleAnalysis).aiSummary,
    aiTopRecommendations: (analysis as AIEnhancedBundleAnalysis).aiTopRecommendations || [],
    issuesBySeverity: {
      high: issues.filter(i => i.severity === 'high'),
      medium: issues.filter(i => i.severity === 'medium'),
      low: issues.filter(i => i.severity === 'low'),
    },
  })
}
