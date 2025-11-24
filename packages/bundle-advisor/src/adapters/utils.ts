export const extractPackageVersion = (path: string): string | undefined => {
  // Extract package name and version from pnpm-style path
  // Example: ../../node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/...
  // Example: ../../node_modules/.pnpm/scheduler@0.23.2/node_modules/scheduler/...
  // Example: ../../node_modules/.pnpm/@babel+core@7.23.0_@babel+types@7.23.0/node_modules/@babel/core/...
  const pnpmMatch = path.match(/node_modules\/\.pnpm\/((?:@[^+]+\+[^@]+)|(?:[^@]+))@([^/_]+)/)

  if (pnpmMatch) {
    return pnpmMatch[2]?.split('_')[0] // Remove any peer dep info
  }

  // Try standard node_modules path
  // Example: ./node_modules/react/index.js
  // Example: ./node_modules/@babel/core/lib/index.js
  const nodeModulesMatch = path.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)

  if (nodeModulesMatch) {
    return nodeModulesMatch[1]
  }
}
