## 1. Overview

**Project Name:** bundle-advisor

**Purpose:** Provide AI-assisted JavaScript bundle optimization with actionable recommendations and optional code change suggestions, complementing existing bundle monitoring tools by focusing on *what to fix* and *how to fix it*, not just on *what changed*.

bundle-advisor ingests bundle statistics (Webpack, Vite/Rollup, esbuild, etc.), applies rule-based analysis and AI reasoning, and produces a prioritized list of optimization opportunities. It integrates into developer workflows via a CLI, CI (GitHub Actions), and—eventually—VS Code and a hosted SaaS dashboard.

This document covers architecture for:

- **MVP / V1**: Local CLI + GitHub Action + basic AI summarization.
- **V2+**: Hosted backend, GitHub App, and AI-generated code patches (high-level).

---

## 2. Goals & Non-goals

### 2.1 Goals

1. **Actionable optimization guidance**
    - Identify high-impact bundle bloat sources.
    - Provide concrete, prioritized recommendations to developers.
2. **Multiple bundler support**
    - Webpack `stats.json`.
    - Vite/Rollup stats (via plugin).
    - esbuild metafile (later).
3. **Developer-first integration**
    - CLI that runs locally or in CI.
    - GitHub Action that posts PR comments with key findings.
4. **AI summarization**
    - LLM-generated human-readable explanations and a prioritized “top fixes” list.
5. **Extensibility**
    - Rule-based engine that can be extended with new heuristics.
    - Pluggable input adapters for new bundlers.
6. **Path to SaaS**
    - Design with clean separation so a backend service can later run the same analysis and persist results.

### 2.2 Non-goals (MVP / V1)

- Automatic application of code fixes (no direct writes to user repos).
- Full SaaS dashboard with auth, orgs, and historical charts.
- Deep framework-specific optimizations (Next.js, Remix, etc.).
- Real-time in-editor integration (VS Code extension) beyond basic planning.

These can be added in later phases (V2+).

---

## 3. High-Level Architecture

### 3.1 Conceptual Diagram (MVP / V1)

```markdown
+----------------------+
| Developer / CI       |
| - CLI                |
| - GitHub Action      |
+----------+-----------+
           |
           v
+----------------------+
| bundle-advisor CLI         |
| - Input Adapters     |
| - Core Analyzer      |
| - Rule Engine        |
| - AI Client          |
| - Report Generator   |
+----------+-----------+
           |
           v
+----------------------+
| Outputs              |
| - JSON Report        |
| - Markdown Report    |
| - PR Comment (via    |
|   GitHub Action)     |
+----------------------+

```

### 3.2 Major Components

1. **CLI / Orchestration Layer**
    - CLI commands to trigger analysis.
    - Parses CLI args, reads config, invokes the analyzer, and writes reports.
2. **Input Adapter Layer**
    - Normalizes stats from different bundlers into a common internal model.
    - Adapters:
        - `WebpackStatsAdapter`
        - `RollupStatsAdapter` / `ViteStatsAdapter`
        - `EsbuildMetafileAdapter` (later).
3. **Core Analysis Engine**
    - Converts normalized bundle data into a rich analysis:
        - Module graph.
        - Chunk graph.
        - Entry vs lazy chunk mapping.
        - Duplicate dependencies.
        - Large module detection.
4. **Rule Engine**
    - Applies rule-based checks to produce structured `Issue` objects.
    - Each rule is independent and pluggable.
5. **AI Advisor (Client Layer)**
    - Packages analysis and issues into a prompt for an LLM.
    - Receives AI-generated text recommendations, prioritization, and optional structured metadata.
6. **Report Generator**
    - Formats results as:
        - JSON (machine-readable).
        - Markdown (human-readable, suitable for PR comments).
7. **Integrations**
    - **GitHub Action wrapper** calls the CLI and posts comments.
    - Later: GitHub App / SaaS backend.

---

## 4. Data Model

### 4.1 Canonical Types (Internal Model)

```tsx
type Module = {
  id: string;            // bundler-specific ID / path
  path?: string;         // file path if resolvable
  size: number;          // bytes (parsed or gzip, depending on adapter)
  chunks: string[];      // IDs of chunks containing this module
  packageName?: string;  // npm package name if known
  packageVersion?: string;
  isVendor: boolean;
};

type Chunk = {
  id: string;
  size: number;
  modules: string[];     // module IDs
  entryPoints: string[]; // entry / route names using this chunk
  isInitial: boolean;    // part of initial load
};

type Analysis = {
  totalSize: number;
  initialSize: number;
  modules: Module[];
  chunks: Chunk[];
  duplicatePackages: {
    packageName: string;
    versions: string[];
    totalSize: number;
  }[];
  largeModules: Module[];
};

```

### 4.2 Issues & Recommendations

```tsx
type IssueSeverity = "low" | "medium" | "high";

type Issue = {
  id: string;
  ruleId: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  bytesEstimate?: number;
  affectedModules: string[];   // module IDs
  fixType:
    | "replace-package"
    | "split-chunk"
    | "lazy-load-module"
    | "dedupe-package"
    | "optimize-imports"
    | "other";
  metadata: Record<string, any>;
};

type AIRankedIssue = Issue & {
  impactScore?: number;  // 0..1
  effortScore?: number;  // 0..1
  priorityScore?: number; // 0..1
  aiNotes?: string;
};

```

### 4.3 Reports

```tsx
type RawReport = {
  analysis: Analysis;
  issues: Issue[];
};

type AIEnhancedReport = {
  analysis: Analysis;
  issues: AIRankedIssue[];
  aiSummary?: string;
  aiTopRecommendations?: string[];
};

```

---

## 5. Core Component Design

### 5.1 CLI Layer

**Responsibilities:**

- Parse arguments and configuration:
    - `-stats`, `-format`, `-output`, `-adapter`, `-no-ai`, etc.
- Construct appropriate adapter.
- Call `Analyzer.analyze()`.
- Optionally call AI advisor if enabled.
- Generate report(s) and write to stdout or file(s).

**Key Modules:**

- `src/cli/index.ts`
- `src/cli/commands/analyze.ts`

### 5.2 Input Adapters

**Goal:** Translate bundler-specific stats into the canonical `AnalysisInput` representation.

**Example: WebpackStatsAdapter**

- Input: Webpack `stats.json`.
- Steps:
    - Extract array of modules and chunks.
    - Determine which chunks are initial vs async.
    - Link modules to chunks.
    - Compute sizes (sum of module sizes per chunk).
    - Derive `duplicatePackages` by grouping modules by `packageName` + `version`.

**Extension Points:**

- Common `IStatsAdapter` interface:
    
    ```tsx
    interface IStatsAdapter {
      canHandle(filePath: string, raw: any): boolean;
      toAnalysisInput(raw: any): AnalysisInput;
    }
    
    ```
    

### 5.3 Core Analyzer

**Responsibilities:**

- Accept normalized input from adapters.
- Build `Analysis`:
    - Build `modules[]` and `chunks[]` lists.
    - Compute `totalSize`, `initialSize`, etc.
    - Identify `duplicatePackages`, `largeModules`.

**Pseudo-code:**

```tsx
class Analyzer {
  constructor(private adapter: IStatsAdapter) {}

  analyze(rawStats: any): Analysis {
    const input = this.adapter.toAnalysisInput(rawStats);
    // build Analysis from input...
    return buildAnalysis(input);
  }
}

```

### 5.4 Rule Engine

**Pattern:** Each rule is a pure function:

```tsx
type Rule = (analysis: Analysis) => Issue[];

```

**Examples (MVP):**

1. `ruleDuplicatePackages`
2. `ruleLargeVendorChunks`
3. `ruleWholeLibraryImports` (based on heuristics and module names)
4. `ruleHugeModules`
5. `ruleLazyLoadCandidates`

Rules are composed in a simple pipeline:

```tsx
const rules: Rule[] = [
  ruleDuplicatePackages,
  ruleLargeVendorChunks,
  ruleHugeModules,
  // ...
];

function runRules(analysis: Analysis): Issue[] {
  return rules.flatMap(rule => rule(analysis));
}

```

This makes adding new rules trivial and testable.

### 5.5 AI Advisor

**Responsibilities:**

- Accept `Analysis` + raw `Issue[]`.
- Summarize:
    - Biggest problems.
    - Potential savings.
    - Recommended order of fixes.
- Optionally assign scores and add notes.

**Interaction pattern:**

```tsx
class AIAdvisor {
  constructor(private llmClient: LLMClient) {}

  async enhance(report: RawReport): Promise<AIEnhancedReport> {
    const prompt = buildPrompt(report);
    const aiResponse = await this.llmClient.call(prompt);

    const { summary, rankedIssues } = parseAIResponse(aiResponse);

    return {
      analysis: report.analysis,
      issues: mergeAIFields(report.issues, rankedIssues),
      aiSummary: summary,
      aiTopRecommendations: rankedIssues.slice(0, 5).map(r => r.title),
    };
  }
}

```

The LLM client itself is abstracted so that different providers can be swapped (OpenAI, etc.).

### 5.6 Report Generator

**Responsibilities:**

- Format `AIEnhancedReport` into:
    - JSON (for tooling/automation).
    - Markdown (for humans / PR comments).

**Markdown Example Sections:**

- Overview (sizes, potential savings).
- Top N issues (with severity and estimated impact).
- AI Summary & Recommendations.
- Detailed issue list.

---

## 6. Integrations

### 6.1 GitHub Action (V1)

**Flow:**

1. CI pipeline builds the app and generates stats (`stats.json`).
2. GitHub Action step:
    - Checks out repo.
    - Installs `bundle-advisor`.
    - Runs: `bundle-advisor analyze --stats-file path/to/stats.json --reporter markdown --output-dir bundle-advisor`.
3. Action uses GitHub CLI / REST API to post the contents of `bundle-advisor/` as a PR comment.

**Security:**

- AI calls use repository-specific tokens (if external LLM is used).
- No source code is exfiltrated unless explicitly configured (MVP uses only stats).

### 6.2 Future: GitHub App (V2+)

Instead of running everything inside CI, a GitHub App:

- Receives events for PRs and pushes.
- Retrieves stats artifacts from CI or an S3 bucket.
- Runs bundle-advisor backend analysis.
- Posts comments via App identity.

This requires a backend service (see Section 8).

---

## 7. Technology Choices

- **Language:** TypeScript (Node.js runtime).
- **CLI:** `commander` or `yargs` for argument parsing.
- **Testing:** `vitest` or `jest`.
- **AST / Source Parsing (V1+):** `@swc/core` or Babel for future source-based rules.
- **Formatting:** Biome (for local dev).
- **AI Client:** Thin wrapper around chosen LLM provider.

For a future SaaS backend:

- **Backend Framework:** React Router fullstack app.
- **Database:** Postgres (via Supabase).
- **Auth:** Supabase Auth for GitHub OAuth and/or email/password.
- **Hosting:** [Fly.io](http://fly.io/), Render, Railway, or Vercel (for the frontend UI).

---

## 8. Future: SaaS Backend Architecture (V2+)

### 8.1 High-Level Backend Diagram

```
+---------------------------+
| Frontend (Dashboard)      |
| - Project views           |
| - Trends, charts          |
+-------------+-------------+
              |
              v
+---------------------------+
| Backend API               |
| - Auth                    |
| - /analyze endpoint       |
| - /projects, /reports     |
+-------------+-------------+
              |
              v
+---------------------------+
| Workers / Jobs            |
| - Run analysis in queue   |
| - Call AI Advisor         |
+-------------+-------------+
              |
              v
+---------------------------+
| Postgres                  |
| - users, orgs, projects   |
| - analyses (JSONB)        |
+---------------------------+

```

### 8.2 Key Backend Endpoints

- `POST /api/analyze`
    - Payload: stats JSON, project ID, commit hash, metadata.
    - Enqueue job for analysis worker.
- `GET /api/projects/:id/analyses`
    - Return list of analyses with size trends, summary metrics.
- `GET /api/analyses/:id`
    - Return full AIEnhancedReport.

---

## 9. Security & Privacy Considerations

- MVP / V1 (Local & CI):
    - Only operates on local artifacts (stats JSON).
    - No source code uploaded by default.
    - AI calls should minimize sensitive data (use summaries, not raw paths, if needed).
- SaaS (V2+):
    - Ensure no proprietary code is logged or stored unless explicitly configured.
    - Provide “no-AI” mode where only rule-based analysis runs.
    - Provide clear documentation on what data is sent to LLM providers.

---

## 10. Performance Considerations

- Stats files can be large for big apps; analysis should:
    - Avoid quadratic operations on modules/chunks.
    - Use streaming or chunked parsing where possible.
- AI calls should:
    - Summarize only necessary parts of the analysis.
    - Use compact JSON for prompt context.
    - Potentially support incremental queries (e.g., AI per top N issues only).

---

## 11. Risks & Mitigations

1. **LLM quality variability**
    - Mitigation: Keep core rule engine deterministic; AI adds value but isn’t required for correctness.
2. **Bundler-specific quirks**
    - Mitigation: Strong adapter abstraction and test corpus with multiple real-world stats files.
3. **CI performance constraints**
    - Mitigation: Allow skipping AI in CI or limiting analysis to changed modules/chunks.
4. **User trust**
    - Mitigation: Provide clear traceability: show which modules/chunks triggered each issue and how estimates are calculated.

---

## 12. Roadmap Alignment

- This architecture supports:
    - **MVP**: CLI, adapters, rule engine, AI advisor, Markdown report.
    - **V1**: Additional bundlers, more rules, GitHub Action, early AST-based rules.
    - **V2**: Backend service, GitHub App, historical analysis, dashboards.
    - **V3+**: Source-level patch generation, IDE extensions, AI-driven code splitting.

---

## 13. Appendix – Example CLI Usage

```bash
# Local analysis
bundle-advisor analyze --stats-file dist/webpack-stats.json --reporter markdown --output-dir bundle-advisor

# JSON output only
bundle-advisor analyze --stats-file dist/stats.json --reporter json > bundle-report.json

# Disable AI (rules only)
bundle-advisor analyze --stats-file dist/stats.json --no-ai --reporter markdown

```

This document should serve as the foundation for implementation and future design refinements.