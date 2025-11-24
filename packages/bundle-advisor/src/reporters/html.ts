import dedent from 'dedent'
import Handlebars from 'handlebars'
import { formatBytes } from '../rules/engine.js'
import type { AIEnhancedBundleAnalysis, BundleAnalysis } from '../types.js'

export function generateHtmlReport(analysis: BundleAnalysis | AIEnhancedBundleAnalysis): string {
  const { chunks, modules, assets, packages, stats, issues } = analysis
  const templateSource = dedent`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bundle Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2, h3 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .high { color: red; }
        .medium { color: orange; }
        .low { color: green; }
      </style>
    </head>
    <body>
      <h1>Bundle Analysis Report</h1>
      <h2>Overview</h2>
      <ul>
        <li><strong>Total Size:</strong> {{formatBytes stats.totalAssetsSize}}</li>
        <li><strong>Initial Size:</strong> {{formatBytes stats.initialChunksSize}}</li>
        <li><strong>Assets:</strong> {{assetsSize}}</li>
        <li><strong>Chunks:</strong> {{chunksSize}}</li>
        <li><strong>Packages:</strong> {{packagesSize}}</li>
        <li><strong>Modules:</strong> {{modulesSize}}</li>
      </ul>

      {{#if potentialSavings}}
      <h3>Potential Savings</h3>
      <p>{{formatBytes potentialSavings}} (estimated)</p>
      {{/if}}

      {{#if aiSummary}}
      <h2>AI Summary</h2>
      <p>{{aiSummary}}</p>
      {{/if}}

      {{#if aiTopRecommendations.length}}
      <h2>Top Recommendations</h2>
      <ol>
        {{#each aiTopRecommendations}}
        <li>{{this}}</li>
        {{/each}}
      </ol>
      {{/if}}

      <h2>Issues</h2>
      {{#each issuesBySeverity}}
      <h3 class="{{@key}}">{{capitalize @key}} Priority Issues</h3>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Estimated Savings</th>
          </tr>
        </thead>
        <tbody>
          {{#each this}}
          <tr>
            <td>{{title}}</td>
            <td>{{description}}</td>
            <td>{{#if bytesEstimate}}{{formatBytes bytesEstimate}}{{else}}N/A{{/if}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      {{/each}}
    </body>
    </html> 
  `

  Handlebars.registerHelper('capitalize', (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  })

  Handlebars.registerHelper('formatBytes', (str: string) => formatBytes(Number.parseInt(str, 10)))

  const template = Handlebars.compile(templateSource)

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
