# Getting Started


## Using the CLI

### Basic Usage

```bash
# Markdown output (default) - works with both Webpack and Vite/bundle-stats formats
bundle-advisor analyze --stats path/to/stats.json

# JSON output
bundle-advisor analyze --stats path/to/stats.json --format json

# Save to file
bundle-advisor analyze --stats path/to/stats.json --format markdown --output report.md
```

The CLI will automatically detect whether the stats file is in Webpack or bundle-stats (Vite) format.

### Generating Stats Files

#### Webpack

To generate a stats file from your Webpack build:

```javascript
// webpack.config.js
module.exports = {
  // ... your config
  plugins: [
    new (require('webpack').StatsWriterPlugin)({
      filename: 'webpack-stats.json',
      stats: {
        all: true,
      },
    }),
  ],
};
```

Or use the CLI:

```bash
webpack --profile --json > webpack-stats.json
```

#### Vite (bundle-stats format)

For Vite projects, you can use the `rollup-plugin-bundle-stats` or similar plugins that generate bundle-stats.json format. The analyzer will automatically detect this format.

## Example Output

See `example-stats.json` for a sample stats file and run:

```bash
bundle-advisor analyze --stats example-stats.json
```

## What the Analyzer Detects

The MVP implementation includes the following rules:

1. **Duplicate Packages** - Detects when the same package appears multiple times with different versions
2. **Large Vendor Chunks** - Identifies vendor chunks over 250KB that could be split
3. **Huge Modules** - Flags individual modules over 200KB
4. **Lazy Load Candidates** - Suggests entry points that could benefit from lazy loading

## Architecture

- **Adapters** (`src/adapters/`) - Normalize different bundler stats formats
- **Analyzer** (`src/analyzer/`) - Core analysis engine
- **Rules** (`src/rules/`) - Pluggable rule system for detecting issues
- **Reports** (`src/reports/`) - JSON and Markdown report generators
- **CLI** (`src/cli/`) - Command-line interface

## Future Enhancements

The design doc (`design-doc.md`) outlines future additions including:

- AI-enhanced recommendations and prioritization
- Support for Vite/Rollup and esbuild stats
- GitHub Action for automated PR comments
- SaaS backend with historical analysis
- Source-level code patches

## Development

### Adding a New Rule

1. Create a new file in `src/rules/`
2. Export a function matching the `Rule` type signature
3. Register it in `src/cli/commands/analyze.ts`

Example:

```typescript
import type { Analysis, Issue } from "../types.js";

export function myNewRule(analysis: Analysis): Issue[] {
  const issues: Issue[] = [];
  
  // Your analysis logic here
  
  return issues;
}
```

### Adding a New Adapter

1. Create a new file in `src/adapters/`
2. Implement the `IStatsAdapter` interface
3. Use it in the CLI command

See `src/adapters/webpack.ts` for reference.
