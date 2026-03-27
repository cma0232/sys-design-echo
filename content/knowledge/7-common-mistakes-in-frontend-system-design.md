---
title: 7 Common Mistakes in Frontend System Design
source: youtube
source_title: 7 Common Mistakes in Frontend System Design
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness, Accessibility (A11y), Offline / PWA, Real-time / Data Sync, Internationalization (i18n)]
tags: [error handling, data fetching, state management, caching, request management, loading states, accessibility, i18n, resilience, real-world scenarios]
---

## Overview
This topic covers seven critical pitfalls that cause frontend system design failures in real-world applications. Rather than stemming from complex technical problems, these failures arise from overlooking edge cases, poor data fetching strategies, inconsistent state management, and neglecting user experience considerations. Understanding and avoiding these mistakes is essential for building resilient, performant, and inclusive frontend systems.

## Core Concepts
- **Happy path vs. unhappy path design**: Building only for ideal conditions (fast networks, powerful devices, perfect user behavior) vs. designing for real-world constraints
- **Data fetching efficiency**: Overfetching (requesting more data than needed) and underfetching (requesting too little, requiring multiple round trips)
- **Request management**: Handling race conditions, debouncing, and request cancellation in dynamic UIs
- **State management architecture**: Organizing state across local, global, and persistent layers to maintain consistency
- **User feedback states**: Loading, error, and empty states as first-class design concerns
- **Caching strategies**: In-memory caches, service workers, and local storage for reducing redundant requests
- **Accessibility and internationalization**: Building inclusive applications from the start rather than retrofitting later

## Architecture / Approaches

### Resilient Design for Real-World Conditions
Design assuming networks are slow, flaky, or broken. Check for offline status before rendering features. Handle scenarios like concurrent edits, deleted resources, and stale data. Example: Show an offline message instead of rendering a form when the user has no connectivity.

### Smart Data Fetching
- **Field-level queries**: Request only the fields needed (e.g., user ID, name, avatar instead of entire user record)
- **Pagination and lazy loading**: Load long lists in chunks and fetch additional sections (comments, posts) only when users interact with them
- **Trade-off**: Fetching less data per request reduces bandwidth but may require more requests; balance based on network conditions and user behavior

### Request Management Pattern
- **Debouncing**: Delay request firing (e.g., 300ms) to avoid firing on every keystroke in search inputs
- **Request cancellation**: Use AbortController to cancel in-flight requests when newer requests supersede them
- **Coordination**: Ensure results arrive in the correct order and override stale responses

### State Organization Strategy
- **Local UI state**: Keep component-specific state (search input text, form values) close to where it's used with hooks like `useState`
- **Global cached data**: Use tools like React Query or Redux for data that needs to be shared across components (search results, user data)
- **Normalized state**: Flatten nested data structures to simplify updates and prevent inconsistencies
- **Single source of truth**: Avoid scattering state across Redux, local storage, and URL parameters

### User Feedback Architecture
Treat loading, error, and empty states as first-class design concerns integrated into the design system. Determine granularity with designers (e.g., loading individual list items vs. entire panel). Provide clear CTAs in empty states to guide users.

### Caching Strategy
- **In-memory caches** (React Query): Cache data for 5-10 minutes to avoid redundant fetches
- **Service workers**: Enable offline-first applications with cached responses
- **Local storage**: Persist user preferences (dark mode, "remember me") across sessions

### Accessibility and Internationalization
- **Semantic HTML**: Use proper heading, button, and landmark elements
- **ARIA attributes**: Add labels and roles for screen readers
- **Contrast and visual design**: Ensure sufficient color contrast for visually impaired users
- **Translation functions**: Wrap hardcoded text in i18n functions from the start, not as an afterthought

## Key Trade-offs

| Trade-off | Consideration |
|-----------|---|
| **Overfetching vs. Underfetching** | Overfetching wastes bandwidth and slows UI; underfetching increases server load and latency. Balance by fetching exactly what's needed and using pagination/lazy loading. |
| **Request debouncing delay** | Longer delays (e.g., 500ms) reduce server load but feel sluggish; shorter delays (e.g., 300ms) feel responsive but increase requests. |
| **Local vs. global state** | Local state is predictable and isolated; global state enables sharing but risks inconsistency if not carefully managed. Use global state only for truly shared data. |
| **Caching duration** | Longer cache TTLs reduce server load but risk stale data; shorter TTLs keep data fresh but increase requests. Choose based on data volatility. |
| **Granular loading states** | Fine-grained loading (per item) feels more responsive but is complex; coarse-grained (whole panel) is simpler but less polished. |
| **Accessibility upfront vs. retrofitting** | Building accessibility in from the start is cheaper and easier; retrofitting is costly and often incomplete. |

## Common Interview Questions

1. **How would you design a search feature that handles rapid user input without overwhelming the backend or showing stale results?**
   - Expected: Mention debouncing, request cancellation (AbortController), and ensuring results arrive in order

2. **Walk me through how you'd structure state for a complex dashboard with user settings, cached API data, and local form state. How do you prevent inconsistencies?**
   - Expected: Separate local UI state from global cached data, normalize state shape, explain single source of truth strategy

3. **A user reports that your product page shows a blank screen when the network fails. How would you redesign this?**
   - Expected: Discuss offline detection, error boundaries, fallback UI, and designing for the unhappy path from the start

4. **Your API returns a large user object with 20 fields, but your profile card only needs 3. What's the problem and how would you fix it?**
   - Expected: Identify overfetching, propose field-level queries or backend filtering, discuss bandwidth and performance impact

5. **How would you implement caching for user settings that rarely change but are fetched on every page load?**
   - Expected: Discuss in-memory caching (React Query), TTL strategy, cache invalidation, and trade-offs with freshness

6. **Describe how you'd handle a scenario where two users edit the same data simultaneously and results arrive out of order.**
   - Expected: Request management, debouncing, cancellation, versioning/timestamps, or optimistic updates

7. **Your app works perfectly on your M3 MacBook but crashes on older Android devices. What might be wrong and how would you prevent this?**
   - Expected: Discuss designing for real-world constraints (slow networks, limited memory, older browsers), testing on actual devices, and progressive enhancement

8. **How would you ensure your frontend system is accessible to screen reader users and non-English speakers without major rework later?**
   - Expected: Semantic HTML, ARIA attributes, i18n functions from the start, collaboration with designers/UX, testing with assistive technologies

## Evaluation Signals

**Strong answers demonstrate:**
- **Real-world thinking**: Acknowledges constraints beyond the happy path (slow networks, old devices, user errors, concurrent operations)
- **Systematic data fetching**: Explains overfetching/underfetching with concrete examples and proposes field-level queries or pagination
- **Request management awareness**: Mentions debouncing, AbortController, and race condition handling unprompted
- **Thoughtful state architecture**: Separates concerns (local UI state vs. global cached data), normalizes state, and explains why
- **User-centric design**: Treats loading, error, and empty states as integral, not afterthoughts; discusses collaboration with designers
- **Caching strategy**: Proposes appropriate caching layers (in-memory, service workers, local storage) with TTL reasoning
- **Inclusive design**: Mentions accessibility and i18n as upfront concerns, not post-launch additions
- **Trade-off articulation**: Explicitly discusses trade-offs (e.g., cache freshness vs. server load) rather than prescribing one-size-fits-all solutions

**Weak answers show:**
- Designing only for ideal conditions without considering failures
- Fetching entire data objects without questioning necessity
- Ignoring request management and race conditions
- Centralizing all state in one global store without separation of concerns
- Treating loading/error states as optional polish
- No caching strategy or vague "just cache it" responses
- Overlooking accessibility and i18n as "nice-to-haves"
- Inability to articulate trade-offs or justify architectural decisions