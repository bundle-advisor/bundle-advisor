import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { RollupPluginBundleStatsAdapter } from '../../adapters/rollup-plugin-bundle-stats.js'
import { WebpackStatsAdapter } from '../../adapters/webpack-stats.js'
import { Analyzer } from '../../analyzer/analyzer.js'
import { generateJsonReport, generateMarkdownReport } from '../../reports/generators.js'
import {
  RuleEngine,
  ruleDuplicatePackages,
  ruleHugeModules,
  ruleLargeVendorChunks,
  ruleLazyLoadCandidates,
} from '../../rules/index.js'
import type { RawReport } from '../../types.js'

export const analyzeCommand = new Command('analyze')
  .description('Analyze bundle stats and generate optimization recommendations')
  .requiredOption('--stats <path>', 'Path to stats file (e.g., webpack-stats.json)')
  .option('--format <format>', 'Output format: json or markdown', 'markdown')
  .option('--output <path>', 'Output file path (defaults to stdout)')
  .option('--no-ai', 'Disable AI analysis (rules only)')
  .action(async options => {
    try {
      const statsPath = resolve(options.stats)
      const format = options.format as 'json' | 'markdown'
      const outputPath = options.output ? resolve(options.output) : null
      const useAI = options.ai !== false

      // Read stats file
      const statsContent = readFileSync(statsPath, 'utf-8')
      const rawStats = JSON.parse(statsContent)

      // Auto-detect adapter
      const adapters = [new RollupPluginBundleStatsAdapter(), new WebpackStatsAdapter()]
      const adapter = adapters.find(a => a.canHandle(statsPath, rawStats))

      if (!adapter) {
        console.error(
          'Error: Stats file format not recognized. Supported formats: Webpack stats.json, bundle-stats.json (Vite)',
        )
        process.exit(1)
      }

      // Analyze
      const analyzer = new Analyzer(adapter)
      const analysis = analyzer.analyze(rawStats)

      // Run rules
      const ruleEngine = new RuleEngine()
      ruleEngine.register(ruleDuplicatePackages)
      ruleEngine.register(ruleLargeVendorChunks)
      ruleEngine.register(ruleHugeModules)
      ruleEngine.register(ruleLazyLoadCandidates)

      const issues = ruleEngine.run(analysis)

      const report: RawReport = {
        analysis,
        issues,
      }

      // AI enhancement (future implementation)
      if (useAI) {
        console.error('Note: AI analysis is not yet implemented. Showing rule-based analysis only.')
      }

      // Generate report
      let output: string
      if (format === 'json') {
        output = generateJsonReport(report)
      } else {
        output = generateMarkdownReport(report)
      }

      // Write output
      if (outputPath) {
        writeFileSync(outputPath, output, 'utf-8')
        console.error(`Report written to ${outputPath}`)
      } else {
        console.log(output)
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })
