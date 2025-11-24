import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { RollupBundleStatsAdapter } from '../../adapters/rollup-bundle-stats.js'
import { WebpackStatsAdapter } from '../../adapters/webpack-stats.js'
import { Analyzer } from '../../analyzer/analyzer.js'
import { type BundleAdvisorConfig, loadConfig, mergeConfig } from '../../config.js'
import {
  generateHtmlReport,
  generateJsonReport,
  generateMarkdownReport,
} from '../../reporters/index.js'
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
  .option('--reporters <reporters...>', 'Reporter format: json or markdown', 'markdown')
  .option('--output-dir <path>', 'Reports directory path (defaults to "bundle-advisor/" in cwd)')
  .option('--no-ai', 'Disable AI analysis (rules only)')
  .action(
    async (args: {
      statsFile?: string
      enabledReporters?: ('json' | 'html' | 'markdown')[]
      outputDir?: string
      ai?: boolean
    }) => {
      try {
        // Load config file
        const fileConfig = loadConfig()

        const cliConfig: BundleAdvisorConfig = {
          statsFile: args.statsFile,
          outputDir: args.outputDir,
        }
        for (const reporter of args.enabledReporters ?? []) {
          switch (reporter) {
            case 'json':
              cliConfig.reporters = { ...cliConfig.reporters, json: true }
              break
            case 'markdown':
              cliConfig.reporters = { ...cliConfig.reporters, markdown: true }
              break
            case 'html':
              cliConfig.reporters = { ...cliConfig.reporters, html: true }
              break
            default:
              console.error(`Warning: Unknown reporter format "${reporter}" ignored.`)
          }
        }
        // Validate reporters

        // Merge config file with CLI options (CLI takes precedence)
        const config = mergeConfig(fileConfig, cliConfig)
        const statsPath = resolve(config.statsFile)
        const useAI = args.ai === true

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

        // Create output directory if it doesn't exist
        if (config.outputDir && !existsSync(config.outputDir)) {
          mkdirSync(config.outputDir, { recursive: true })
        }

        const reports: { content: string; path: string }[] = []
        for (const [reporter, enabled] of Object.entries(config.reporters)) {
          if (!enabled) continue

          switch (reporter) {
            case 'json': {
              reports.push({
                content: generateJsonReport(analysis),
                path: resolve(config.outputDir, 'report.json'),
              })
              break
            }
            case 'markdown': {
              reports.push({
                content: generateMarkdownReport(analysis),
                path: resolve(config.outputDir, 'report.md'),
              })
              break
            }
            case 'html': {
              reports.push({
                content: generateHtmlReport(analysis),
                path: resolve(config.outputDir, 'report.html'),
              })
              break
            }
            default:
              console.warn(`Warning: Unknown reporter "${reporter}" skipped.`)
            // Future implementation
          }
        }

        // Write reports to files
        await Promise.all(
          reports.map(({ content, path: reportPath }) =>
            writeFile(reportPath, content, {
              encoding: 'utf-8',
              flag: 'w+', // Force file to be created or overwritten
            }),
          ),
        )
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
        process.exit(1)
      }
    },
  )
