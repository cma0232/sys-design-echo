---
title: Real-time Updates in Frontend Applications
source: youtube
source_title: Real-time Updates
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness, Real-time / Data Sync]
tags: [real-time updates, WebSocket, GraphQL subscriptions, data synchronization, collaborative applications, pub-sub pattern, relay, cache management]
---

## Overview
Real-time updates enable UIs to stay synchronized with backend data and other users' changes without requiring manual refresh or polling. This is essential for collaborative tools (Trello, Notion), chat applications (Slack, Discord), and live dashboards where instant data reflection significantly impacts user experience. Understanding the architecture, trade-offs, and implementation patterns is critical for building scalable real-time features.

## Core Concepts
- **Real-time synchronization**: Data flows from server to client automatically as changes occur, with UI responding without user interaction
- **WebSocket protocol**: Bidirectional communication channel enabling server-to-client push notifications
- **GraphQL subscriptions**: Server-side mechanism to define and broadcast events to subscribed clients
- **Pub-Sub pattern**: Backend maintains listener lists; when mutations occur, events are published to all subscribed clients
- **Relay cache management**: Automatic cache updates when subscription data arrives; relay matches IDs and updates all references
- **Subscription handler**: Client-side setup that establishes WebSocket connection and bridges subscription events to data layer
- **Event-driven architecture**: Mutations trigger events that are broadcast to interested subscribers

## Architecture / Approaches

### GraphQL Subscriptions + Relay (Demonstrated Approach)
**Flow**: User action → Mutation sent to backend → Backend processes & publishes event via pub-sub → WebSocket broadcasts to subscribed clients → Relay updates cache → UI automatically reflects changes

**Implementation steps**:
1. Define subscription in GraphQL schema with event name and board ID filter
2. Set up WebSocket server on backend (built on HTTP server, listening on GraphQL endpoint)
3. In mutation handler, publish event with changed data after successful operation
4. On frontend, define subscription query specifying what data to fetch when event occurs
5. Use `useSubscription` hook in React component to connect subscription
6. Create subscription handler that establishes WebSocket connection and configures protocol upgrade

**Strengths**: Clean declarative syntax, automatic cache synchronization, type-safe with GraphQL, minimal manual state management

### REST API + Manual WebSocket (Alternative Approach)
**Flow**: Establish WebSocket connection manually → Subscribe to relevant events (e.g., card-moved) → On event receipt, manually update cache using tools like React Query's `setQueryData` → Handle state merging and consistency

**Implementation steps**:
1. Set up WebSocket client (Socket.io, graphql-ws, or similar)
2. Subscribe to specific event topics
3. On event, manually fetch or update cache in data layer
4. Manage state merging and avoid race conditions

**Strengths**: Works with any backend, flexible, not tied to GraphQL

**Weaknesses**: Developer responsible for cache management, higher complexity, more prone to inconsistencies and race conditions

## Key Trade-offs

| Aspect | GraphQL Subscriptions + Relay | REST API + Manual WebSocket |
|--------|-------------------------------|----------------------------|
| **Complexity** | Lower (declarative, automatic cache) | Higher (manual cache management) |
| **Type Safety** | Full GraphQL type safety | Depends on REST API setup |
| **Cache Consistency** | Automatic ID matching and updates | Manual merging required |
| **Learning Curve** | Steeper (Relay concepts) | Moderate (WebSocket basics) |
| **Scalability** | Proven at scale with proper setup | Requires careful state management |
| **Flexibility** | Tied to GraphQL ecosystem | Works with any backend |

**Polling vs Real-time**: Polling is simpler but inefficient (constant requests, higher latency, server load); real-time via WebSocket is more complex but provides instant updates and better resource utilization.

## Common Interview Questions

1. **Walk me through the architecture**: How would you implement real-time card movement in a Trello-like app? What components are involved on frontend and backend?

2. **WebSocket vs Polling**: When would you choose WebSocket subscriptions over polling? What are the trade-offs in terms of complexity, latency, and server resources?

3. **Cache synchronization**: How does Relay automatically update the UI when subscription data arrives? What happens if the same data is updated via multiple subscriptions?

4. **Subscription filtering**: In the board example, why is the board ID passed as a variable to the subscription? What problems does this solve?

5. **Without Relay**: How would you implement real-time updates using React Query or a REST API? What additional challenges arise?

6. **Race conditions**: What could go wrong if a user makes a local mutation while a subscription event for the same data is in flight? How would you handle this?

7. **Scaling considerations**: If you have thousands of users on the same board, what backend concerns arise with pub-sub and WebSocket connections?

8. **Fallback strategies**: What happens if the WebSocket connection drops? How would you handle reconnection and catching up on missed events?

## Evaluation Signals

**Strong answers demonstrate**:
- Clear understanding of the end-to-end flow from user action to UI update
- Ability to explain why WebSocket is necessary (push vs pull)
- Knowledge of pub-sub pattern and how backend maintains listener lists
- Understanding of cache synchronization mechanisms (especially with Relay)
- Awareness of trade-offs between different approaches (GraphQL subscriptions vs manual WebSocket)
- Consideration of edge cases (connection drops, race conditions, missed events)
- Practical knowledge of implementation details (subscription handler setup, protocol upgrade)

**Weak answers show**:
- Vague understanding of how data reaches the client
- Confusion between subscriptions and polling
- Lack of awareness of cache management complexity
- No discussion of trade-offs or alternative approaches
- Missing consideration of failure scenarios
- Inability to explain why specific tools (Relay, GraphQL) are chosen