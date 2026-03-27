---
title: Server-Side Rendering (SSR)
source: youtube
source_title: Server-Side Rendering
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness]
tags: [SSR, server-side rendering, hydration, streaming, React, build configuration, manifest, renderToPipeableStream]
---

## Overview
Server-Side Rendering (SSR) solves the blank page problem in client-side React applications by rendering components on the server and sending HTML to the browser immediately, rather than waiting for JavaScript to load and execute. This approach improves both actual and perceived performance, making applications feel responsive from the first moment while enabling proper SEO and better experiences on slower networks.

## Core Concepts

- **Client-Side Rendering Problem**: Users see a blank page while the JavaScript bundle downloads and React initializes, creating a sluggish first impression
- **Server-Side Rendering**: The server runs React components, generates HTML, and sends the complete document to the browser before JavaScript loads
- **Hydration**: The process where React attaches event listeners and interactivity to server-rendered HTML without re-rendering the DOM
- **Streaming**: Sending HTML to the browser in chunks as components finish rendering, rather than waiting for the entire page to be ready
- **Build Manifest**: A JSON file mapping source code to optimized production build assets, enabling the server to inject correct script and CSS tags
- **Entry Points**: Separate entry files for client-side (entry-client.tsx) and server-side (entry-server.tsx) builds
- **renderToPipeableStream**: React API that streams HTML as it's generated, replacing the older renderToString approach

## Architecture / Approaches

### Traditional SSR (Non-Streaming)
- Server renders entire React tree to completion before sending any HTML
- Browser receives complete HTML document in one chunk
- **Trade-off**: Simpler implementation but slower perceived performance; users wait for all components to finish rendering before seeing anything

### Streaming SSR
- Server sends HTML shell/layout immediately as soon as the outermost component is ready
- Remaining components stream to the browser as they finish rendering
- Uses React Suspense to show fallbacks while slower components load
- **Trade-off**: More complex implementation but significantly better perceived performance; users see content almost instantly even while slower components still render

### Build Configuration Setup
1. **Configure build tool** (e.g., Vite) for dual builds:
   - Enable manifest file generation
   - Create dedicated client entry file (entry-client.tsx)
   - Create dedicated server entry file (entry-server.tsx)
   - Ensure React/ReactDOM are bundled in server build, not external

2. **Manifest File Role**:
   - Maps source files to hashed production filenames
   - Enables server to inject correct `<script>` and `<link>` tags
   - Bridges gap between source code and optimized production build

3. **Server Implementation**:
   - Use Express or similar framework (not Vite dev server)
   - Fetch required data before rendering
   - Call server entry point with initial data
   - Stream HTML response to client
   - Inject initial data into HTML for hydration

## Key Trade-offs

- **Streaming vs Non-Streaming SSR**: Streaming provides better perceived performance and user experience but requires more complex implementation and careful component structure; non-streaming is simpler but makes users wait longer for initial content
- **Server Rendering Overhead vs Client-Side Rendering**: SSR adds server-side computation cost and complexity but eliminates blank page problem and improves SEO; pure client-side rendering is simpler but degrades user experience on initial load
- **Hydration Matching**: Server and client must render identical HTML trees for hydration to work without re-rendering; mismatches cause React to re-render the entire tree, negating performance benefits
- **Build Complexity**: Dual build system (client + server) adds configuration complexity but enables proper asset injection and code splitting

## Common Interview Questions

1. **Why does SSR solve the blank page problem, and what's the cost of that solution?**
   - Expected answer should explain immediate HTML delivery vs server computation overhead, and mention hydration as the mechanism for adding interactivity

2. **What is hydration and why is it necessary in SSR?**
   - Should explain that server renders static HTML, client needs to attach event listeners and make it interactive; hydration reuses existing DOM rather than re-rendering

3. **What's the difference between renderToString and renderToPipeableStream, and when would you use each?**
   - renderToString waits for complete render before sending; renderToPipeableStream sends HTML chunks as components finish, improving perceived performance

4. **Why is the manifest file critical in SSR, and what happens without it?**
   - Should explain that manifest maps source files to hashed production filenames; without it, server can't inject correct script/CSS tags after build optimization

5. **How do you set up a dual build system for SSR, and what are the key configuration steps?**
   - Should cover: enabling manifest, creating separate entry points, configuring both client and server builds, ensuring React is bundled in server build

6. **What happens if server-rendered HTML doesn't match client-rendered HTML during hydration?**
   - Should explain that React will re-render the entire tree, defeating the purpose of SSR and causing performance issues

7. **How does streaming improve the user experience compared to traditional SSR?**
   - Should explain that streaming shows layout/shell immediately while slower components render asynchronously, making the app feel alive faster

8. **What data needs to be injected into the HTML for successful client-side hydration?**
   - Should mention initial data, board ID, or any props needed for the client to render the same tree as the server

## Evaluation Signals

**Strong Answer Indicators:**
- Clearly articulates the blank page problem and how SSR solves it
- Explains hydration as the critical bridge between server HTML and client interactivity
- Understands the role of the manifest file in connecting source code to production builds
- Distinguishes between streaming and non-streaming SSR with specific performance implications
- Recognizes the importance of server/client render matching for hydration success
- Discusses trade-offs: added server complexity vs improved user experience
- Can walk through the complete flow: build setup → server rendering → streaming → hydration

**Weak Answer Indicators:**
- Treats SSR as purely a performance optimization without mentioning perceived vs actual performance
- Doesn't explain hydration or confuses it with re-rendering
- Overlooks the manifest file's role in production builds
- Doesn't distinguish between streaming and non-streaming approaches
- Ignores the requirement for identical server/client render output
- Focuses only on benefits without discussing implementation complexity or trade-offs
- Can't explain why a separate Express server is needed instead of using dev server