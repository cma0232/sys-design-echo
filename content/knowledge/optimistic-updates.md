---
title: Optimistic Updates
source: youtube
source_title: Optimistic Updates
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness, Real-time / Data Sync]
tags: [optimistic updates, UI responsiveness, mutation handling, error recovery, local state management, react-query, user experience]
---

## Overview
Optimistic updates is a UX pattern where the frontend immediately reflects user actions in the UI before receiving server confirmation, then rolls back if the request fails. This technique eliminates perceived latency in network-dependent operations like liking posts or submitting comments, creating a more fluid and responsive user experience without sacrificing data integrity.

## Core Concepts
- **Optimistic UI Update**: Immediately update the local UI state to reflect the user's action before the server responds
- **Background Request**: Send the mutation request to the server asynchronously while the UI has already changed
- **Rollback Mechanism**: Revert the UI to its previous state if the server request fails
- **Local Cache Management**: Manipulate the frontend cache (e.g., React Query's query data) before server confirmation
- **Temporary IDs**: Use client-generated temporary identifiers for new items until the server returns the actual ID
- **Error Recovery**: Preserve user input (e.g., form text) when rolling back so users don't lose their work
- **Context Preservation**: Store previous state in a context object to enable rollback on failure

## Architecture / Approaches

### Standard Approach (Without Optimistic Updates)
- User triggers action → UI shows loading state → Wait for server response → Update UI with server data
- **Trade-off**: Safe and simple, but creates noticeable latency especially on slow networks; breaks user flow

### Optimistic Updates Approach
1. **Cancel ongoing queries** to prevent race conditions
2. **Get local cache** using query key (e.g., `queryClient.getQueryData('feeds')`)
3. **Set query data immediately** with the optimistic change (new comment with temporary ID)
4. **Send mutation request** in background without blocking UI
5. **On success**: Merge server response, replace temporary IDs with actual server IDs
6. **On error**: Call `onError` callback to restore previous state and preserve user input

**Trade-off**: More complex implementation but provides instant feedback; requires careful error handling and state synchronization.

## Key Trade-offs

| Trade-off | Details |
|-----------|---------|
| **Complexity vs UX** | Optimistic updates add implementation complexity (temporary IDs, rollback logic, context management) but significantly improve perceived performance |
| **Consistency vs Responsiveness** | Optimistic updates assume success and may briefly show stale data; standard approach guarantees consistency but feels sluggish |
| **Data Loss vs User Friction** | On error, preserve user input (form text) to avoid losing work, even though the action failed |
| **Query Cancellation vs Race Conditions** | Must cancel in-flight queries before optimistic update to prevent multiple requests competing for the same resource |

## Common Interview Questions

1. **How would you implement optimistic updates for a like button in a social media feed?** (Expect: immediate UI change, background request, rollback on failure)

2. **What happens if two users try to modify the same resource simultaneously while using optimistic updates?** (Expect: discussion of race conditions, query cancellation, server-side conflict resolution)

3. **How do you handle temporary IDs for newly created items before the server assigns real IDs?** (Expect: generate client-side temporary IDs, replace with server IDs in onSuccess callback)

4. **What should happen to user input if an optimistic update fails?** (Expect: preserve form data, show error message, offer retry mechanism)

5. **How do you synchronize the local cache with the server response after an optimistic update succeeds?** (Expect: use onSuccess callback to set query data with server response, merge temporary and actual IDs)

6. **When would you NOT use optimistic updates?** (Expect: operations with high failure rates, operations requiring server validation before UI update, destructive operations)

7. **How do you prevent race conditions when canceling queries during optimistic updates?** (Expect: cancel in-flight queries before setting optimistic data, understand query key scoping)

8. **How would you handle a scenario where the server rejects a comment submission due to content policy violations?** (Expect: rollback UI, restore form text, display error message, potentially disable retry)

## Evaluation Signals

**Strong Answer Indicators:**
- Understands the three-phase flow: optimistic update → background request → success/error handling
- Explains how to use query keys and `queryClient.getQueryData()` / `setQueryData()` for local state management
- Discusses temporary ID generation and replacement strategy
- Addresses error handling with rollback and input preservation
- Mentions query cancellation to prevent race conditions
- Considers when optimistic updates are appropriate vs. when they're not

**Weak Answer Indicators:**
- Treats optimistic updates as simply showing a loading state
- Doesn't explain rollback mechanism or error recovery
- Ignores the complexity of managing temporary IDs
- Forgets to preserve user input on failure
- Doesn't discuss race conditions or query management
- Assumes all operations should use optimistic updates without nuance