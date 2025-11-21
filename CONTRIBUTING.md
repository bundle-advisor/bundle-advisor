# Contributing 

## Installation

```bash
pnpm install
pnpm i -g turbo
```

## Commands

- Build - `turbo build`
- Test - `turbo test:unit`
 
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
3. Use it in the `analyze` CLI command

See `src/adapters/webpack-stats.ts` for reference.
