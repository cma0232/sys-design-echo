---
title: Designing a Scalable Social Feed (Twitter/LinkedIn-style)
source: youtube
source_title: How to Design a Twitter/LinkedIn Feed (Interview)
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Communication & Drive, Performance Awareness, Real-time / Data Sync]
tags: [feed design, infinite scroll, pagination, component architecture, data modeling, real-time updates, performance optimization, social platforms]
---

## Overview
Designing a scalable feed list is one of the most common frontend system design interview topics. While it may seem straightforward—just render some posts—it involves complex challenges around infinite scrolling, pagination, real-time updates, and performance optimization. This topic tests a candidate's ability to gather requirements, structure components hierarchically, model data effectively, and optimize for real-world constraints like mobile devices and large datasets.

## Core Concepts
- **Requirement Clarification (CC Door Framework)**: Collect information before designing—device type (mobile/desktop), data scale, content types (text, images, rich media), real-time update needs, and user interactions
- **Component Hierarchy**: Breaking down the feed into modular pieces—FeedList → FeedItem → Avatar, Content, Interactions, Comments
- **Pagination & Infinite Loading**: Loading only initial items (e.g., 10) and fetching more as users scroll to the bottom
- **Data Modeling**: Defining Post, User, Attachment, and PaginatedFeedList structures with proper relationships
- **State Management**: Handling loading, error, and success states with skeleton loaders and error fallbacks
- **Real-time Updates**: Deciding between polling and WebSocket based on requirements
- **Data Normalization**: Flattening nested data structures to simplify updates and reduce redundancy

## Architecture / Approaches

### Component Structure Approach
Break the feed into a tree of reusable components:
- **FeedList**: Container managing pagination and scroll triggers
- **FeedItem**: Individual post with avatar, content, and interactions
- **Avatar**: User profile picture with hover popup showing user details
- **Content**: Text, images, or rich media (may require layout logic for multiple images/videos)
- **Interactions**: Like, favorite, share, comment buttons
- **Comments Section**: Expandable comment form and existing comments list
- **LoadMore Trigger**: Sentinel element at bottom to detect scroll and fetch next page
- **Skeleton/Error States**: Placeholder components for loading and error fallback UI

**Trade-off**: More granular components increase reusability but add complexity; coarser components are simpler but less flexible.

### Data Modeling Approach
Start simple and evolve:
1. **Basic Post**: ID, author (User), content (string), attachments (URLs), timestamps (createdAt, updatedAt), stats (likeCount)
2. **User Type**: name, title, description, registeredAt
3. **Attachment**: Store as URL reference (files in separate storage, database holds reference only)
4. **PaginatedFeedList**: Array of feeds + pageInfo (hasNext, cursor pointing to last element for next fetch)
5. **Filters**: ID, name, query string (optional, for feed filtering)

**Trade-off**: Nested structures are intuitive but harder to update; normalized (flattened) structures reduce redundancy and simplify updates.

### Pagination Strategy
- **Cursor-based Pagination**: Use cursor (ID of last element) to fetch next page—more efficient for large datasets and handles insertions/deletions better than offset
- **Load-on-Scroll**: Detect when user reaches bottom (via sentinel element or Intersection Observer) and trigger fetch

**Trade-off**: Cursor-based is more scalable but requires backend support; offset-based is simpler but less efficient at scale.

### Real-time Updates
- **Polling**: Periodically fetch updates (simpler, but wasteful and higher latency)
- **WebSocket**: Bi-directional connection for instant updates (more complex, but better UX)

**Trade-off**: Polling works with REST APIs but is inefficient; WebSocket is real-time but requires infrastructure changes.

## Key Trade-offs

| Trade-off | Option A | Option B |
|-----------|----------|----------|
| **Device Target** | Desktop (more resources, larger viewport) | Mobile (limited memory/CPU, smaller screen) |
| **Content Types** | Text-only (simpler) | Rich media with images/videos (complex layout logic) |
| **Real-time Updates** | Polling (simple, REST-compatible) | WebSocket (real-time, requires new protocol) |
| **Data Structure** | Nested/hierarchical (intuitive) | Normalized/flattened (easier updates, less redundancy) |
| **Pagination** | Offset-based (simple) | Cursor-based (scalable, handles mutations) |
| **Component Granularity** | Fine-grained (reusable, complex) | Coarse-grained (simple, less flexible) |
| **State Handling** | Optimistic updates (fast UX, risky) | Pessimistic updates (safe, slower UX) |

## Common Interview Questions

1. **How would you handle infinite scrolling on mobile devices with limited memory?** (Expect: virtual scrolling, windowing, unloading off-screen items)

2. **What's your approach to real-time feed updates when new posts are added by other users?** (Expect: polling vs WebSocket trade-off, how to merge new items without jarring UX)

3. **How would you structure the data to efficiently update a single post's like count without refetching the entire feed?** (Expect: data normalization, separate entities for posts and users)

4. **What happens when a user scrolls to the bottom and the load-more request fails?** (Expect: error state handling, retry logic, user feedback)

5. **How would you optimize image loading in a feed with many posts containing images?** (Expect: lazy loading, image compression, placeholder/skeleton states)

6. **Should you normalize the feed data, and if so, how?** (Expect: understanding of nested vs flat structures, trade-offs in update complexity)

7. **How would you handle pagination with cursor-based vs offset-based approaches, and which is better for a social feed?** (Expect: cursor-based reasoning for scalability and handling concurrent mutations)

8. **What's your strategy for showing loading states and skeleton screens without blocking the UI?** (Expect: component-level loading states, placeholder components, progressive rendering)

## Evaluation Signals

### Strong Answer
- **Asks clarifying questions first** before designing (device type, data scale, content types, real-time needs, interactions)
- **Structures components hierarchically** with clear separation of concerns and modularity
- **Defines data models explicitly** with proper types and relationships, discusses normalization trade-offs
- **Addresses pagination and infinite scroll** with cursor-based approach and scroll trigger mechanism
- **Considers edge cases**: loading states, errors, empty states, real-time conflicts
- **Discusses performance optimizations**: virtual scrolling for mobile, lazy loading images, efficient data fetching
- **Communicates trade-offs clearly** (e.g., polling vs WebSocket, nested vs normalized data)
- **Iterates and refines** based on interviewer feedback

### Weak Answer
- **Jumps to implementation** without understanding requirements
- **Treats feed as a flat list** without considering pagination, real-time updates, or performance
- **Ignores mobile constraints** (memory, CPU, battery)
- **Doesn't model data explicitly** or discuss normalization
- **Overlooks edge cases** like loading/error states, network failures, concurrent updates
- **Vague on real-time strategy** or assumes simple polling without justification
- **No discussion of trade-offs** or optimization strategies
- **Doesn't ask for clarification** or iterate on design