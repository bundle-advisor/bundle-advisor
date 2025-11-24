import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { RollupBundleStatsAdapter } from '../../adapters/rollup-bundle-stats.js'
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

export const analyzeCommand = new Command('analyze')
  .description('Analyze bundle stats and generate optimization recommendations')
  .option('--stats-file <path>', 'Path to stats file (e.g., webpack-stats.json)')
  .option('--reporter <reporter>', 'Reporter format: json or markdown', 'markdown')
  .option('--output-dir <path>', 'Reports directory path (defaults to "bundle-advisor/" in cwd)')
  .option('--no-ai', 'Disable AI analysis (rules only)')
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
        const useAI = cliConfig.ai === true

        // Read stats file
        const statsContent = readFileSync(statsPath, 'utf-8')
        const rawStats = JSON.parse(statsContent)

        // Auto-detect adapter
        const adapters = [new RollupBundleStatsAdapter(), new WebpackStatsAdapter()]
        const adapter = adapters.find(a => a.canHandle(statsPath, rawStats))

        if (!adapter) {
          console.error(
            'Error: Stats file format not recognized. Supported formats: Webpack stats.json, bundle-stats.json (Vite)',
          )
          process.exit(1)
        }

        // Run rules with configuration
        const ruleEngine = new RuleEngine()

        // For now, register all built-in rules
        // TODO: Make rule selection configurable
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

        // Analyze
        const analyzer = new Analyzer(adapter, ruleEngine)
        const analysis = analyzer.analyze(rawStats)

        // AI enhancement (future implementation)
        if (useAI) {
          console.error(
            'Note: AI analysis is not yet implemented. Showing rule-based analysis only.',
          )
        }

        // Generate report
        let output: string
        if (reportFormat === 'json') {
          output = generateJsonReport(analysis)
        } else {
          output = generateMarkdownReport(analysis)
        }

        // Create output directory if it doesn't exist
        if (config.outputDir && !existsSync(config.outputDir)) {
          mkdirSync(config.outputDir, { recursive: true })
        }

        // Write output
        if (reportPath) {
          writeFileSync(reportPath, output, {
            encoding: 'utf-8',
            flag: 'w+', // Force file to be created or overwritten
          })
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
