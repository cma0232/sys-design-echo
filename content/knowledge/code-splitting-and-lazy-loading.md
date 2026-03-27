---
title: Code Splitting and Lazy Loading
source: youtube
source_title: Code Splitting and Lazy Loading
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness]
tags: [bundling, code-splitting, lazy-loading, tree-shaking, webpack, rollup, vite, bundle-optimization, dynamic-imports]
---

## Overview
Code splitting and lazy loading are fundamental bundling strategies that reduce initial page load time by breaking monolithic bundles into smaller chunks and deferring non-critical code. This topic is essential in frontend system design interviews because it demonstrates understanding of how modern bundlers work, how to optimize bundle size, and how to architect applications that scale without performance degradation.

## Core Concepts

- **Bundling**: The process of combining multiple source files into one or more optimized JavaScript files that browsers can load efficiently
- **Dependency Graph**: A map of all imports/exports that bundlers build to understand code relationships
- **Tree Shaking**: Static analysis that removes unused code from the bundle by analyzing import/export statements
- **Code Splitting**: Dividing code into separate chunks that load on-demand rather than in a single monolithic bundle
- **Dynamic Imports**: Using `import()` syntax to load modules asynchronously at runtime
- **Minification**: Reducing file size by removing whitespace, shortening variable names, and obfuscating code
- **Chunk**: A separate JavaScript file created by the bundler, often with a content hash for cache busting

## Architecture / Approaches

### Tree Shaking (Static Analysis)
- **How it works**: Bundlers analyze ES module imports/exports statically to identify unused code and exclude it from the final bundle
- **Requirements**: Must use ES modules with static import/export statements (not CommonJS)
- **Trade-off**: Requires disciplined code organization; dynamic imports or CommonJS patterns prevent tree shaking
- **Example**: Importing only the `add` function from a math utility file excludes `subtract`, `multiply`, `divide` from the bundle

### Code Splitting with Dynamic Imports
- **How it works**: Use `import()` to load modules asynchronously; bundlers automatically create separate chunks for dynamically imported modules
- **Chunk Creation**: Each dynamic import creates a separate file with a content hash (e.g., `advanced.hash.js`)
- **Trade-off**: Requires runtime overhead and network request for the additional chunk; benefits only users who access that feature
- **Best for**: Heavy features, modals, help menus, accordion expansions, or features not used by all users
- **Example**: Loading an advanced calculator module only when user clicks "Load Advanced" button

### Minification
- **How it works**: Removes whitespace, shortens variable names, and obfuscates code to reduce file size
- **Default behavior**: Enabled in production builds; can be disabled for debugging
- **Trade-off**: Reduces readability and debuggability; significant file size reduction in real-world applications

### Bundler Configuration
- **Vite/Rollup**: Modern bundlers that use Rollup under the hood; Vite uses native ES modules in dev mode (no bundling) for speed, bundles for production
- **Build Process**: Analyzes entry file, follows all imports, builds dependency graph, outputs optimized files with content hashes

## Key Trade-offs

| Trade-off | Details |
|-----------|---------|
| **Single Bundle vs Code Splitting** | Single bundle: simpler, fewer requests, but larger initial load. Code splitting: smaller initial payload, but multiple requests and runtime overhead for features not all users need. |
| **Tree Shaking Effectiveness vs Module Organization** | Tree shaking requires static imports; dynamic imports or namespace imports (`import * as`) prevent tree shaking and force bundler to include entire modules. |
| **Minification vs Debuggability** | Minified code is smaller but unreadable; unminified code aids debugging but increases bundle size significantly. |
| **Granular Code Splitting vs Request Overhead** | Fine-grained splitting (separate chunks per function) maximizes tree shaking but increases HTTP requests; coarser splitting reduces requests but may load unused code. |
| **Dynamic Namespace Imports vs Selective Imports** | `import * as namespace` loads entire module safely but prevents tree shaking of unused exports; named imports enable tree shaking but require knowing exact exports at build time. |

## Common Interview Questions

1. **How would you reduce the bundle size of a large single-page application? Walk through the optimization steps.**
   - Expected: Mention tree shaking, code splitting, minification, and analyzing bundle composition

2. **Explain the difference between tree shaking and code splitting. When would you use each?**
   - Expected: Tree shaking removes unused code statically; code splitting defers loading of used-but-not-immediate code. Tree shaking is always beneficial; code splitting is for features not needed on initial load.

3. **You have a heavy feature (e.g., a data visualization library) that only 10% of users access. How would you architect this?**
   - Expected: Dynamic import to create a separate chunk; load only when user accesses that feature; discuss trade-offs of extra request vs smaller initial bundle.

4. **Why does dynamic import with namespace (`import * as`) prevent tree shaking? How would you fix it?**
   - Expected: Bundler cannot statically determine which properties are accessed at runtime, so it includes entire module. Fix by splitting into separate modules or using named imports.

5. **What's the relationship between your code organization (file structure, import patterns) and bundler optimization?**
   - Expected: Static imports enable tree shaking; ES modules required; avoid circular dependencies; one component per file aids modularity but requires bundler to stitch together.

6. **How does Vite's dev mode differ from its production build, and why?**
   - Expected: Dev mode uses native ES modules (no bundling) for speed; production uses Rollup bundling for optimization, minification, and code splitting.

7. **You notice a chunk is still 500KB after code splitting. How would you investigate and optimize further?**
   - Expected: Use bundle analysis tools; check for duplicate dependencies; verify tree shaking is enabled; consider further splitting; audit for unused libraries.

8. **How would you measure the impact of code splitting on real user performance?**
   - Expected: Monitor initial page load time, time to interactive, chunk download times; compare before/after; consider user segments (users who access advanced features vs those who don't).

## Evaluation Signals

**Strong Answer Indicators:**
- Understands the full pipeline: bundling → dependency graph → tree shaking → code splitting → minification
- Distinguishes between static analysis (tree shaking) and runtime deferral (code splitting)
- Recognizes that code organization directly impacts bundler optimization (static imports vs dynamic imports)
- Discusses trade-offs explicitly (bundle size vs request count, initial load vs feature access latency)
- Provides concrete examples (modals, help menus, advanced features) for when to use code splitting
- Mentions bundler analysis tools and how to measure impact
- Understands limitations (namespace imports prevent tree shaking; bundler cannot guarantee runtime property access)

**Weak Answer Indicators:**
- Conflates tree shaking and code splitting as the same concept
- Suggests code splitting without considering the cost (extra HTTP request, parsing overhead)
- Ignores the requirement for static imports to enable tree shaking
- Proposes splitting without measuring or analyzing actual bundle composition
- Doesn't discuss trade-offs or when each technique is appropriate
- Treats bundler configuration as a black box without understanding the dependency graph analysis