# bundle-advisor

AI-assisted JavaScript bundle optimization with actionable recommendations.

## Features

- **Multiple bundler support**: Webpack stats.json, Vite/bundle-stats.json
- **Rule-based analysis**: Identifies duplicate packages, large modules, and optimization opportunities
- **Actionable recommendations**: Prioritized list of fixes with estimated impact
- **Developer-first**: CLI tool for local and CI environments

## Installation

```bash
pnpm add -D bundle-advisor
```

## Usage

```bash
# Markdown output (default) - works with both Webpack and Vite/bundle-stats formats
bundle-advisor analyze --stats path/to/stats.json
```

### Configuration File

You can create a `bundle-advisor.config.json` file in your project root to configure default settings. 

```json
{
  "reporter": "json",
  "reportsDirectory": "path/to/file.md",
  "statsFile": "path/to/stats.json",
  "rules": {
    "maxChunkSize": 256000,
    "maxModuleSize": 256000,
    "minLazyLoadThreshold": 102400
  }
}
```

**Configuration Options:**

- `reporter`: Report format (`"json"` or `"markdown"`). Defaults to `"markdown"`.
- `reportsDirectory`: Path to write reports. Will write to console if `undefined`. Defaults to `resolve(process.cwd(), "bundle-advisor-reports")`
- `statsFile`: Path to the stats file. Defaults to `resolve(process.cwd(), "stats.json")`
- `rules`: Rule-specific thresholds
  - `maxChunkSize`: Maximum chunk size in bytes (default: 250KB)
  - `maxModuleSize`: Maximum module size in bytes (default: 200KB)
  - `minLazyLoadThreshold`: Minimum size for lazy load candidates in bytes (default: 100KB)

**Note:** CLI arguments take precedence over config file settings.

### Set the output format

```bash
# JSON
bundle-advisor analyze --stats path/to/stats.json --format json

# Markdown
bundle-advisor analyze --stats path/to/stats.json
```

### Write to a file

```bash

# Markdown
bundle-advisor analyze --stats path/to/stats.json --format markdown --output report.md

# JSON
bundle-advisor analyze --stats path/to/stats.json --format json --output report.json
```

The CLI will auto-detect the format (Webpack or bundle-stats).

### Disable AI (rules only)

```bash
bundle-advisor analyze --stats dist/stats.json --no-ai --format markdown
```

