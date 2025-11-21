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

