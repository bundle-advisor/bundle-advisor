import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { RollupPluginBundleStatsAdapter } from '../../adapters/rollup-plugin-bundle-stats.js'
import { WebpackStatsAdapter } from '../../adapters/webpack-stats.js'
import { Analyzer } from '../../analyzer/analyzer.js'
import { loadConfig, mergeConfig } from '../../config.js'
import { generateJsonReport, generateMarkdownReport } from '../../reporters/index.js'
import {
  createDuplicatePackagesRule,
  createHugeModulesRule,
  createLargeVendorChunksRule,
  createLazyLoadCandidatesRule,
  RuleEngine,
} from '../../rules/index.js'
import type { RawReport } from '../../types.js'

export const analyzeCommand = new Command('analyze')
  .description('Analyze bundle stats and generate optimization recommendations')
  .requiredOption('--stats-file <path>', 'Path to stats file (e.g., webpack-stats.json)')
  .option('--reporter <reporter>', 'Reporter format: json or markdown', 'markdown')
  .option('--output-dir <path>', 'Reports directory path (defaults to "bundle-advisor/" in cwd)')
  .option('--no-ai', 'Disable AI analysis (rules only)', 'false')
  .action(
    async (cliConfig: {
      statsFile?: string
      reporter?: 'json' | 'markdown'
      outputDir?: string
      ai?: boolean
    }) => {
      try {
        // Load config file
        const fileConfig = loadConfig()

        // Merge config file with CLI options (CLI takes precedence)
        const config = mergeConfig(fileConfig, cliConfig)
        const statsPath = resolve(config.statsFile)
        const reportFormat = config.reporter
        const reportPath = config.outputDir
          ? resolve(config.outputDir, reportFormat === 'json' ? 'report.json' : 'report.md')
          : null
        const useAI = cliConfig.ai !== false

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

        // Run rules with configuration
        const ruleEngine = new RuleEngine()
        ruleEngine.register(createDuplicatePackagesRule())
        ruleEngine.register(
          createLargeVendorChunksRule({ maxChunkSize: config.rules.maxChunkSize }),
        )
        ruleEngine.register(createHugeModulesRule({ maxModuleSize: config.rules.maxModuleSize }))
        ruleEngine.register(
          createLazyLoadCandidatesRule({
            minLazyLoadThreshold: config.rules.minLazyLoadThreshold,
          }),
        )

        const issues = ruleEngine.run(analysis)

        const report: RawReport = {
          analysis,
          issues,
        }

        // AI enhancement (future implementation)
        if (useAI) {
          console.error(
            'Note: AI analysis is not yet implemented. Showing rule-based analysis only.',
          )
        }

        // Generate report
        let output: string
        if (reportFormat === 'json') {
          output = generateJsonReport(report)
        } else {
          output = generateMarkdownReport(report)
        }

        // Write output
        if (reportPath) {
          writeFileSync(reportPath, output, 'utf-8')
          console.error(`Report written to ${reportPath}`)
        } else {
          console.log(output)
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
        process.exit(1)
      }
    },
  )
