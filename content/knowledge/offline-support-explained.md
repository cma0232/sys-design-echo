---
title: Offline Support in Web Applications
source: youtube
source_title: Offline Support Explained
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness, Offline / PWA]
tags: [offline support, service workers, cache API, PWA, network resilience, application shell, fetch strategies]
---

## Overview
Offline support is a critical frontend system design problem that addresses how web applications behave when network connectivity is unavailable or unstable. Rather than a fancy feature, it's a reliability concern that ensures users see a functional UI shell instead of blank screens or error pages when networks drop during page loads, Wi-Fi switches, or mobile transitions.

## Core Concepts

- **Service Workers**: Background scripts that intercept network requests and control application behavior independently of page state
- **Cache API**: Browser storage mechanism for request-response pairs (HTML, CSS, JavaScript, API responses)
- **Navigation Requests**: Special category of requests triggered by page loads/refreshes that must be handled carefully to prevent application failure
- **Application Shell**: Minimal UI structure (HTML, CSS, JS) cached during service worker installation to enable offline startup
- **Offline Detection**: Using `navigator.onLine` property and `online`/`offline` browser events to track connectivity state
- **Fetch Strategies**: Patterns for handling different request types (navigation, static assets, API calls) with different caching approaches

## Architecture / Approaches

### Network-First Strategy (for Navigation & Fresh Content)
- Attempt to fetch from network first
- Cache the response upon success
- Fall back to cached offline HTML if network fails
- **Best for**: Navigation requests, frequently-updated content
- **Trade-off**: Slower on poor connections but ensures freshness

### Cache-First Strategy (for Static Assets)
- Check cache first for the requested resource
- Return cached version if available
- Fetch from network and update cache if not cached
- **Best for**: JavaScript, CSS, images that change infrequently
- **Trade-off**: Faster offline experience but may serve stale assets

### Layered Offline Support
1. **Layer 1 (Critical)**: Application starts with UI shell when offline—no blank screen
2. **Layer 2+**: Progressive enhancement with cached data, read-only functionality
- Does NOT guarantee full functionality without internet
- Does NOT provide real-time updates
- Does NOT solve conflict-free editing

## Key Trade-offs

| Trade-off | Details |
|-----------|---------|
| **Network-First vs Cache-First** | Network-first ensures fresh data but slower on poor connections; cache-first is faster but may serve stale content |
| **Caching All vs Selective Caching** | Caching everything increases storage but guarantees offline availability; selective caching saves space but limits offline functionality |
| **Read-Only vs Read-Write Offline** | Read-only is simpler to implement; read-write requires conflict resolution and sync strategies (out of scope for basic offline support) |
| **POST/Write Requests** | Should not be cached; requires separate handling and queue-based sync strategies when connectivity returns |
| **Offline HTML Fallback** | Simple offline page guarantees UI shell but provides no data; more complex caching enables richer offline experience |

## Common Interview Questions

1. **How would you handle navigation requests differently from API requests in a service worker?** (Probe: understanding of fetch event interception and routing logic)

2. **What's the difference between network-first and cache-first strategies, and when would you use each?** (Probe: trade-off reasoning and use case matching)

3. **How do you detect when a user comes back online and what should happen next?** (Probe: `online` event handling and sync strategies)

4. **Why is the application shell pattern important for offline support?** (Probe: understanding of critical rendering path and user perception)

5. **How would you handle API requests that return data in an offline-first application?** (Probe: cache-first strategy for APIs, stale-while-revalidate patterns)

6. **What are the limitations of basic offline support, and what problems does it NOT solve?** (Probe: realistic scoping—no real-time sync, no conflict resolution, no write operations)

7. **How would you test offline functionality during development?** (Probe: Chrome DevTools network throttling, service worker debugging)

8. **What happens to POST/PUT/DELETE requests when the user is offline, and how should you handle them?** (Probe: understanding that writes shouldn't be cached; introduces queue/sync complexity)

## Evaluation Signals

**Strong Answer Indicators:**
- Distinguishes between navigation, static asset, and API requests with appropriate strategies
- Explains why application shell is critical (prevents blank screen/dinosaur page)
- Acknowledges scope limitations (offline ≠ full functionality, no real-time, no conflict resolution)
- Discusses service worker lifecycle (install, activate, fetch phases)
- Considers write operations separately from reads
- Mentions testing approach (DevTools throttling)
- Reasons about trade-offs explicitly (freshness vs speed, storage vs coverage)

**Weak Answer Indicators:**
- Treats offline support as "cache everything"
- Conflates offline support with real-time sync or conflict-free editing
- Doesn't distinguish between request types
- Ignores navigation request handling (the most critical piece)
- No mention of service worker or Cache API specifics
- Doesn't address write operations or their complexity
- Vague about when to use which caching strategy