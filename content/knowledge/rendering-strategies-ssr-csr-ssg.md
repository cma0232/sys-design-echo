---
title: Rendering Strategies (SSR/CSR/SSG/Islands/RSC)
source: youtube
source_title: Rendering Strategies (SSR/CSR/SSG)
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness, Accessibility (A11y)]
tags: [rendering, CSR, SSR, SSG, island-architecture, React-Server-Components, performance, SEO, hydration, JavaScript-bundle]
---

## Overview
Rendering strategies determine where and when HTML is generated for web applications—on the client, server, or at build time. Understanding these approaches is critical for frontend system design because they directly impact initial load performance, SEO, scalability, and user experience. Choosing the right strategy for your use case is a core competency in frontend architecture.

## Core Concepts

- **Client-Side Rendering (CSR)**: Browser loads an empty HTML shell, JavaScript fetches data and builds the DOM dynamically
- **Server-Side Rendering (SSR)**: Server generates full HTML with content on each request; browser receives ready-made page then hydrates
- **Static Site Generation (SSG)**: HTML pages generated at build time and served as flat files from CDN or static server
- **Island Architecture**: Entire page rendered as static HTML, but specific interactive "islands" are hydrated with JavaScript
- **React Server Components (RSC)**: Components rendered only on server, sending HTML with zero JavaScript for non-interactive parts
- **Hydration**: Process of attaching event handlers and interactivity to server-rendered HTML
- **Time to First Byte (TTFB)**: Metric measuring when user first sees content
- **SEO Impact**: Search engines need real content in HTML; CSR-only apps require extra work for indexing

## Architecture / Approaches

### Client-Side Rendering (CSR)
- User receives empty HTML shell (e.g., `<div id="root"></div>`)
- JavaScript loads, fetches data, builds DOM
- **Pros**: Simple, powerful, fully dynamic, works well for SPAs
- **Cons**: Delays initial paint, hurts SEO, requires JavaScript to work at all, poor performance on slow networks/low-end devices
- **Best for**: Single-page applications (Trello, Notion, Twitter) where everything is dynamically driven
- **Fallback**: Must detect JavaScript support and show fallback message if disabled

### Server-Side Rendering (SSR)
- Server generates complete HTML with actual content on every request
- Browser receives ready-made page, then hydrates (adds interactivity)
- **Pros**: Fast TTFB, excellent SEO, content visible immediately, gracefully degrades without JavaScript
- **Cons**: Server load on every request, slower than SSG, requires server infrastructure
- **Best for**: Pages with user-specific data or dynamic content (Confluence, Jira)
- **Pattern**: Server generates per-request content dynamically, sends full HTML with content already in the document

### Static Site Generation (SSG)
- HTML pages generated once at build time
- Served as flat files from CDN or static server
- **Pros**: Instant page loads, no server work needed, extremely fast and reliable, cheap to host
- **Cons**: Cannot handle user-specific data, requires rebuild for content updates, not suitable for frequently changing content
- **Best for**: Blogs, documentation, marketing sites, content that doesn't change often (Martin Fowler's blog, personal homepages)
- **Pattern**: Build process generates all HTML ahead of time; everyone sees identical content

### Island Architecture
- Entire page rendered as static HTML at build time or per-request
- Only specific interactive "islands" (components) are hydrated with JavaScript
- Rest of page remains static and lightweight
- **Pros**: Fine-grained control over hydration, reduces JavaScript bundle size, improves performance, more resilient
- **Cons**: More complex to implement, requires identifying which parts need interactivity
- **Best for**: Large applications where only certain UI sections need interactivity (Jira with sidebar/header static, main content interactive)
- **Pattern**: Hybrid approach combining SSR/SSG for static parts with CSR for interactive islands

### React Server Components (RSC)
- Components rendered only on server, sending HTML with zero JavaScript for that part
- Allows skipping hydration entirely for non-interactive components
- **Pros**: Smaller JavaScript bundles, zero JavaScript overhead for read-only content, better performance
- **Cons**: React-specific, newer pattern with less ecosystem maturity, requires framework support (Next.js App Router)
- **Best for**: Product descriptions, read-only tables, any component that doesn't need interactivity
- **Pattern**: Server-only components send HTML; client components handle interactivity where needed

## Key Trade-offs

| Trade-off | CSR | SSR | SSG | Islands | RSC |
|-----------|-----|-----|-----|---------|-----|
| **Initial Load Speed** | Slow (waits for JS) | Fast (HTML ready) | Instant (pre-built) | Fast (minimal JS) | Fast (no JS for static) |
| **SEO** | Poor (needs extra work) | Excellent | Excellent | Good | Excellent |
| **Server Load** | None | High (per-request) | None | Low | Medium |
| **Dynamic Content** | Full support | Full support | No support | Partial support | Partial support |
| **User-Specific Data** | Yes | Yes | No | Limited | Limited |
| **JavaScript Bundle** | Large | Large | Small | Small | Smallest |
| **Complexity** | Low | Medium | Low | High | High |
| **Works Without JS** | No | Yes | Yes | Partial | Partial |

**Key Trade-off Pairs**:
- **CSR vs SSR**: CSR is simpler but delays initial paint and hurts SEO; SSR provides fast TTFB and SEO but adds server load
- **SSG vs SSR**: SSG is instant and cheap but cannot handle dynamic/user-specific data; SSR handles dynamics but requires server work per request
- **Full Hydration vs Islands**: Full hydration is simpler but sends unnecessary JavaScript; islands reduce bundle but add complexity
- **CSR for Everything vs Strategic Rendering**: CSR everywhere is simple but causes slow initial loads and SEO problems; strategic mixing optimizes for each use case

## Common Interview Questions

1. **Why does Trello require JavaScript enabled while Confluence pages work without it? Explain the rendering strategies behind each.**
   - Tests understanding of CSR vs SSR trade-offs and real-world examples

2. **You're building a marketing website with a blog. Which rendering strategy would you choose and why?**
   - Tests decision-making: SSG is optimal (fast, cheap, no server load), but follow-up could explore hybrid approaches

3. **Describe the island architecture pattern. When would you use it instead of full-page SSR or CSR?**
   - Tests understanding of hybrid approaches and when to optimize JavaScript bundle size

4. **What is hydration and why is it necessary in SSR? What problem does React Server Components solve related to hydration?**
   - Tests understanding of the SSR process and newer optimization patterns

5. **You have a dashboard with user-specific data that needs to load fast and be SEO-friendly. What rendering strategy would you use?**
   - Tests ability to combine strategies: SSR for dynamic content + potentially islands for interactive parts

6. **How would you decide between SSG and SSR for a content-heavy website?**
   - Tests trade-off analysis: SSG if content is static, SSR if content changes frequently or is user-specific

7. **Explain how island architecture reduces JavaScript bundle size and improves performance compared to full CSR.**
   - Tests understanding of selective hydration and performance optimization

8. **What are the SEO implications of using pure client-side rendering, and how would you mitigate them?**
   - Tests awareness of CSR limitations and workarounds (pre-rendering, server-side rendering, dynamic rendering)

## Evaluation Signals

**Strong Answer Indicators**:
- Clearly articulates the trade-offs between strategies (performance vs complexity, SEO vs simplicity)
- Provides specific real-world examples (Trello/Notion for CSR, Confluence for SSR, blogs for SSG)
- Explains *why* a strategy is chosen, not just *what* it is
- Understands hydration and its performance implications
- Recognizes that modern apps often use hybrid approaches, not single strategies
- Discusses JavaScript bundle size and its impact on performance
- Mentions graceful degradation and accessibility (pages working without JavaScript)
- Can articulate when each strategy is optimal and when it's suboptimal

**Weak Answer Indicators**:
- Treats strategies as isolated concepts without discussing trade-offs
- Cannot explain why one strategy might be better than another for a given use case
- Lacks concrete examples or only uses abstract descriptions
- Confuses hydration with rendering or doesn't understand the concept
- Suggests using CSR for everything without acknowledging SEO/performance costs
- Doesn't consider user experience on slow networks or low-end devices
- Misses the point that strategy choice depends on content type and user needs
- Cannot explain the difference between SSG and SSR beyond "when it happens"