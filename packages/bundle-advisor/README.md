# bundle-advisor


AI-assisted JavaScript bundle optimization with actionable recommendations.

> Note: Bundle Advisor is currently in beta. Please expect (and report) any bugs, inaccurate recommendations, or other issues you encounter.

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

### CLI

```bash
# Markdown output (default) - works with both Webpack and Vite/bundle-stats formats
bundle-advisor analyze --stats-file path/to/stats.json
```

**Set the output format**

```bash
# Markdown (default)
bundle-advisor analyze --stats-file path/to/stats.json

# JSON
bundle-advisor analyze --stats-file path/to/stats.json --reporters json

# HTML
bundle-advisor analyze --stats-file path/to/stats.json --reporters html

# Multiple
bundle-advisor analyze --stats-file path/to/stats.json --reporters json,html,markdown
```

**Write to a directory**

```bash
bundle-advisor analyze --stats-file path/to/stats.json --output-dir reports
```

The CLI will auto-detect the format (Webpack or bundle-stats).


### Configuration

You can configure via the CLI arguments or create a `bundle-advisor.config.json` file in your project root.

```json
{
  "reporters": { "json": true },
  "statsFile": "path/to/stats.json",
  "outputDir": "path/to/file.md",
  "rules": {
    "maxChunkSize": 256000,
    "maxModuleSize": 256000,
    "minLazyLoadThreshold": 102400
  }
}
```

**Supported Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `statsFile` | `string` | `stats.json`| The path to the input bundle stats file to analyze. |
| `outputDir` | `string \| undefined` | `"bundle-advisor"`| The directory to write report files. Writes to console when explicitly set to `undefined`. |
| `reporters.html` | `boolean` | `false`| Determines if an HTML report is generated in `<outputDir>/report.html` |
| `reporters.json` | `boolean` | `false`| Determines if a JSON report is generated in `<outputDir>/report.json` |
| `reporters.markdown` | `boolean` | `true`| Determines if a markdown report is generated in `<outputDir>/report.md` |
| `rules.maxChunkSize` | `number` | `250 * 1024` | Maximum chunk size in bytes |
| `rules.maxModuleSize` | `number` | `200 * 1024` | Maximum module size in bytes |
| `rules.maxModuleSize` | `number` | `100 * 1024` | Minimum size for lazy load candidates in bytes |


**Notes:** 
* All configuration options are optional
* CLI arguments take precedence over config file settings.
* All directory and file paths must be relative to `process.cwd()`