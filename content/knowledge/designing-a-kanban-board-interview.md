---
title: Designing a Kanban Board Application
source: youtube
source_title: Designing a Kanban Board (Interview)
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Communication & Drive, Performance Awareness, Accessibility (A11y), Real-time / Data Sync]
tags: [kanban board, data modeling, state management, collaboration, real-time updates, normalization, API design, pagination, component structure]
---

## Overview
Designing a Kanban board (or task board) is a common frontend system design interview question that appears deceptively simple but opens up complex design decisions around state management, data modeling, collaboration, and real-time synchronization. The problem is valuable in interviews because it allows candidates to demonstrate understanding of full-stack frontend concerns including component architecture, data normalization, API design, and performance optimization.

## Core Concepts

- **Problem Framing through Language**: The language used to describe the problem shapes all subsequent design decisions. Introducing concepts like "users," "collaboration," and "persistence" expands the design space significantly.
- **Data Normalization**: Separating concerns (boards, columns, cards, users) into independent entities referenced by ID, rather than nesting them deeply, prevents data duplication and synchronization issues.
- **Collaboration & Real-time Updates**: Multiple users working on the same board requires decisions about how changes propagate (polling, WebSocket, server-sent events).
- **Pagination Strategy**: Cards can grow unbounded; pagination decisions affect API design, data modeling, and client-side update handling.
- **Component Hierarchy**: Board → Columns → Cards, with supporting UI areas like user sections, filters, and settings.
- **Cross-functional Requirements**: Performance, accessibility, internationalization, security, and offline support must be considered alongside functional requirements.

## Architecture / Approaches

### Data Modeling Approaches

**Nested Structure (Initial Intuitive Approach)**
- Board contains Columns array; Columns contain Cards array; Cards contain User objects
- Pros: Intuitive, directly maps to UI rendering, easy to understand initially
- Cons: Data duplication (same user appears in multiple cards), difficult updates, inconsistency risks, poor scalability

**Normalized Structure (Recommended)**
- Separate entities: boards, columns, cards, users—each stored independently and referenced by ID
- Pros: Single source of truth for each entity, updates in one place propagate everywhere, easier to scale, naturally supports collaboration features
- Cons: Requires deriving/computing related data, slightly more complex initial setup

### API Protocol Choices

**RESTful API**
- Pros: Simple, widely supported, no third-party libraries needed, plain fetch works
- Cons: Less flexible in query shapes, may require multiple requests

**GraphQL**
- Pros: Flexible data fetching, clients request exactly what they need
- Cons: More complex, requires additional tooling

### Data Loading Strategies

**Single Request (Load Everything)**
- Pros: Simple implementation
- Cons: Poor performance with large boards, blocks rendering

**Pagination Approaches**
- Offset-based: Simple but problematic with concurrent updates
- Cursor-based: More robust with concurrent modifications
- Incremental per-column: Load cards on-demand per column
- Pros/Cons: Trade-off between simplicity and handling concurrent updates gracefully

### Real-time Update Propagation

**Polling**
- Pros: Simple, works everywhere, no special infrastructure
- Cons: Inefficient, latency, server load

**WebSocket / Server-Sent Events**
- Pros: Real-time, efficient, lower latency
- Cons: More complex infrastructure, connection management overhead

## Key Trade-offs

- **Nested vs Normalized Data**: Nested is intuitive initially but causes duplication and update complexity; normalized requires more setup but scales better and prevents inconsistency.
- **Load Everything vs Pagination**: Loading all data is simple but fails at scale; pagination adds complexity but is necessary for large boards.
- **Polling vs WebSocket**: Polling is simpler and universally supported but inefficient; WebSocket is real-time but requires more infrastructure and connection handling.
- **REST vs GraphQL**: REST is simpler and requires no special libraries; GraphQL is more flexible but adds complexity and tooling overhead.
- **Perceived Performance vs Actual Performance**: Loading skeletons and states improve perceived performance quickly; actual performance requires caching, avoiding rerenders, and efficient data structures.

## Common Interview Questions

1. How would you structure the data model for a board with multiple users, and why would you choose normalization over nesting?
2. If a user changes their name, how does your data model ensure that change is reflected everywhere they appear on the board?
3. How would you handle real-time updates when multiple users are editing the same board simultaneously?
4. What pagination strategy would you use for a board with potentially thousands of cards, and how would that affect your API design?
5. How would you optimize the rendering performance of a board with hundreds of cards across multiple columns?
6. What happens when a user's network connection is slow or drops while they're dragging a card—how do you handle that gracefully?
7. How would you make a Kanban board accessible to users navigating with keyboard only or using a screen reader?
8. Would you use REST or GraphQL for this system, and what are the trade-offs in your choice?

## Evaluation Signals

**Strong Answers Demonstrate:**
- Intentional problem framing: Asking clarifying questions about users, collaboration, real-time requirements, board creation, column modification, and scale before diving into solutions
- Understanding of data modeling trade-offs: Recognizing that nested structures cause duplication and choosing normalization proactively
- Systems thinking: Connecting decisions across layers (data model → API design → pagination → client-side updates)
- Awareness of non-functional requirements: Mentioning performance, accessibility, internationalization, security, and offline support without prompting
- Practical reasoning: Explaining why certain choices matter (e.g., "normalization prevents inconsistency when user data changes")
- Scalability mindset: Considering how the system behaves as boards, cards, and users grow

**Weak Answers Show:**
- Jumping to implementation without clarifying requirements
- Proposing deeply nested data structures without considering update complexity
- Ignoring collaboration and real-time concerns
- Treating performance as an afterthought rather than a design consideration
- Not considering accessibility or internationalization
- Vague API design without thinking through pagination or update propagation
- Treating each layer (data, API, UI) as independent rather than interconnected