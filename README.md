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

### Analyze a Webpack stats file

```bash
bundle-advisor analyze --stats dist/webpack-stats.json --format markdown --output bundle-report.md
```

### Analyze a Vite/bundle-stats file

```bash
bundle-advisor analyze --stats dist/bundle-stats.json --format markdown --output bundle-report.md
```

The CLI will auto-detect the format (Webpack or bundle-stats).

### JSON output

```bash
bundle-advisor analyze --stats dist/stats.json --format json > bundle-report.json
```

### Disable AI (rules only)

```bash
bundle-advisor analyze --stats dist/stats.json --no-ai --format markdown
```

## Documentation

See [design-doc.md](./docs/getting-started.md) for more details.
