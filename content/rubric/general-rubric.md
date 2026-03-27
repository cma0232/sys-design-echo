---
title: Frontend System Design General Rubric
type: rubric
version: 1.0
---

# Frontend System Design — General Evaluation Rubric

## Core Dimensions
*Applied to every question.*

### 1. Problem Framing
- Asks clarifying questions before diving in (functional vs non-functional requirements)
- Defines scope appropriately — not over-engineering, not missing critical features
- Identifies frontend-specific constraints (browser limitations, device differences, network conditions)

**Scoring:**
- 1 — Jumps straight into solution with no clarification
- 2 — Asks some questions but misses key constraints
- 3 — Clarifies requirements systematically, sets clear scope
- 4 — Proactively surfaces hidden constraints and makes explicit trade-offs on scope

---

### 2. Architecture Design
- Component hierarchy is logical and well-reasoned
- Data flow is clearly defined (unidirectional vs bidirectional, where state lives)
- State management strategy is appropriate (local / global / server state boundaries)

**Scoring:**
- 1 — No clear structure, jumps between ideas
- 2 — Basic structure but data flow is unclear or state management is misplaced
- 3 — Clear component breakdown with justified state decisions
- 4 — Elegant architecture with explicit reasoning, considers edge cases in structure

---

### 3. Trade-off Discussion
- Proactively raises multiple approaches (doesn't just give one answer)
- Clearly articulates pros and cons of each option
- Makes a decision grounded in the specific context (not generic "it depends")

**Scoring:**
- 1 — Gives one solution with no alternatives
- 2 — Mentions alternatives but doesn't compare them meaningfully
- 3 — Explicit trade-off discussion with context-aware decision
- 4 — Deep trade-off reasoning, considers second-order effects, quantifies where possible

---

### 4. Communication & Drive
- Leads the conversation rather than waiting for prompts
- Thinking is structured and easy to follow
- Responds well to follow-up questions and can go deeper on demand

**Scoring:**
- 1 — Passive, needs constant prompting
- 2 — Some initiative but loses structure under follow-ups
- 3 — Leads discussion, maintains clarity throughout
- 4 — Controls the narrative, handles curveballs gracefully, time-boxes appropriately

---

## Contextual Dimensions
*Activated per-question based on relevance.*

### 5. Performance Awareness
- Considers rendering performance (virtualization, memoization, avoiding unnecessary re-renders)
- Considers network performance (caching, request deduplication, prefetching)
- Bundle size awareness (code splitting, lazy loading)

### 6. Accessibility (A11y)
- Keyboard navigation support
- ARIA attributes and semantic HTML
- Screen reader compatibility
- Color contrast and visual accessibility

### 7. Offline / PWA
- Service worker strategy
- Cache-first vs network-first decisions
- Conflict resolution when reconnecting

### 8. Real-time / Data Sync
- WebSocket vs SSE vs polling — when to use each
- Optimistic updates and rollback strategy
- Handling concurrent edits

### 9. Internationalization (i18n)
- Text externalization strategy
- RTL layout support
- Date/number/currency formatting

### 10. Security
- XSS prevention
- CSRF considerations
- Sanitizing user-generated content

---

## Notes
- This rubric is a living document — expand based on patterns observed in interviews
- Contextual dimensions should be added to topic pages as `active_dimensions`
- A score of 3+ on all core dimensions = hire signal for mid-level; 4s needed for senior
