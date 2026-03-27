---
title: Pagination Strategies (Offset, Cursor, Infinite Scroll)
source: youtube
source_title: Pagination (Offset, Cursor, Infinite Scroll)
active_dimensions: [Problem Framing, Architecture Design, Trade-off Discussion, Performance Awareness]
tags: [pagination, offset-based, cursor-based, infinite-scroll, database-queries, API-design, performance]
---

## Overview
Pagination is the practice of splitting large datasets into smaller, manageable chunks to reduce network data transfer, improve page responsiveness, and minimize database load. Understanding the two main pagination styles—offset-based and cursor-based—and when to apply each is critical for building scalable frontend systems. This topic bridges frontend UI patterns with backend database query optimization.

## Core Concepts

- **Offset-based Pagination**: Skip N items, then fetch M items (e.g., `LIMIT 10 OFFSET 20`)
- **Cursor-based Pagination**: Use a bookmark (timestamp, ID, or encoded value) to fetch items after a specific point
- **Infinite Scroll**: A UI variation of cursor-based pagination that auto-loads more items as the user scrolls
- **Metadata**: Response includes pagination state (current page, total pages, has_next, total_items)
- **Database Query Translation**: Frontend parameters (limit, offset, cursor) map directly to SQL clauses
- **Cursor Encoding**: Cursors are often Base64-encoded to hide internal implementation details from clients

## Architecture / Approaches

### Offset-Based Pagination
**How it works**: Frontend sends `limit` and `offset` parameters. Backend executes `SELECT * FROM table LIMIT {limit} OFFSET {offset}`. Response includes metadata (current page, total pages, total items) and data rows.

**Strengths**:
- Simple to implement and understand
- Easy random access to any page number
- Minimal state management on frontend

**Weaknesses**:
- Slow for large offsets (database must scan all skipped rows)
- Prone to duplicates/misses if data is inserted/deleted during pagination
- Not suitable for infinite feeds or frequently-changing datasets

**Best for**: Small to medium datasets, admin dashboards, reports that don't change often

### Cursor-Based Pagination
**How it works**: Frontend sends a cursor (encoded timestamp or ID). Backend executes `SELECT * FROM table WHERE created_at < {cursor} ORDER BY created_at DESC LIMIT {limit}`. The last item's cursor value becomes the next page's cursor.

**Strengths**:
- Consistent performance regardless of dataset size
- Handles insertions/deletions gracefully (no duplicates/misses)
- Ideal for infinite feeds and real-time data
- Cursor can be opaque/encoded to hide implementation

**Weaknesses**:
- Cannot jump to arbitrary page numbers
- Backward pagination requires reversing order and reversing results
- Slightly more complex to implement

**Best for**: Infinite feeds, social media timelines, large or frequently-changing datasets

### Infinite Scroll
**How it works**: Variation of cursor-based pagination where the UI uses Intersection Observer (or similar) to detect when the user scrolls near the bottom, automatically triggering the next fetch. Metadata includes a `has_more` flag.

**Characteristics**:
- Seamless user experience (no explicit "next" button)
- Underlying mechanism is still cursor-based
- Can degrade to manual "Load More" button if auto-loading becomes too aggressive

## Key Trade-offs

| Aspect | Offset-Based | Cursor-Based |
|--------|--------------|--------------|
| **Performance at scale** | Degrades with large offsets | Consistent regardless of position |
| **Random page access** | ✓ Supported (page 10 directly) | ✗ Not supported (must traverse sequentially) |
| **Data consistency** | ✗ Duplicates/misses if data changes | ✓ Resilient to insertions/deletions |
| **Implementation complexity** | Simple (2 parameters) | Moderate (cursor encoding/decoding) |
| **Use case fit** | Static, small-medium datasets | Dynamic, large, infinite feeds |

## Common Interview Questions

1. **Why would you choose cursor-based pagination over offset-based for a social media feed?**
   - Expected answer: Offset becomes slow at large values; cursor handles insertions/deletions without duplicates; better for infinite scroll UX.

2. **How would you implement backward pagination with cursor-based pagination?**
   - Expected answer: Use the first item's cursor with a `>` condition instead of `<`, reverse the sort order, then reverse the result set before returning to frontend.

3. **What is the purpose of encoding cursors (e.g., Base64), and what does it hide?**
   - Expected answer: Encoding obscures internal details (timestamp, ID values) from clients, allowing backend flexibility to change implementation without breaking API contracts.

4. **Why does offset-based pagination cause duplicates or misses when new items are inserted?**
   - Expected answer: If items are inserted before the current offset position, the offset shifts; users may see the same item twice or skip items entirely.

5. **How would you handle the "Load More" button fallback in an infinite scroll implementation?**
   - Expected answer: Track a `has_more` flag in metadata; if auto-loading becomes too frequent, switch to manual trigger; use Intersection Observer with a threshold to detect scroll position.

6. **What metadata should an offset-based pagination API response include?**
   - Expected answer: Current page, page size, total items, total pages, has_next, has_previous.

7. **How does the database query differ between offset and cursor pagination?**
   - Expected answer: Offset uses `LIMIT X OFFSET Y`; cursor uses `WHERE timestamp < {cursor} LIMIT X` (or similar comparison operator).

8. **Can you jump to page 50 with cursor-based pagination? Why or why not?**
   - Expected answer: No, because cursors are positional bookmarks, not absolute page numbers. You must traverse sequentially from the beginning.

## Evaluation Signals

**Strong answers demonstrate**:
- Clear understanding of the database-level mechanics (SQL queries, index usage)
- Ability to articulate trade-offs with specific examples (e.g., "offset is O(n) at the database level")
- Recognition of real-world constraints (data mutations, scale, UX requirements)
- Knowledge of when to apply each pattern (small vs. large datasets, static vs. dynamic)
- Awareness of cursor encoding as an abstraction layer
- Practical implementation details (metadata structure, frontend state management, Intersection Observer for infinite scroll)

**Weak answers show**:
- Treating pagination as purely a UI concern without understanding database implications
- Inability to explain why offset fails at scale
- Confusion about cursor mechanics or backward pagination
- Missing discussion of data consistency issues
- Generic answers without concrete examples or trade-off analysis