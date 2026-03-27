---
title: Implementing Accessible Drag and Drop in React
source: youtube
source_title: Pragmatic Drag and Drop in React — Accessibility Essentials
active_dimensions: [Accessibility (A11y), Architecture Design, Problem Framing, Communication & Drive]
tags: [drag-and-drop, keyboard-navigation, screen-reader, ARIA, focus-management, headless-components, React-context]
---

## Overview
This topic covers transforming a mouse-only drag-and-drop interface into a fully accessible experience that supports keyboard navigation and screen reader announcements. It demonstrates practical patterns for making interactive components inclusive without sacrificing user experience, which is critical for frontend systems that serve diverse user populations.

## Core Concepts

- **Keyboard Accessibility**: Making interactive elements focusable and navigable via keyboard (tabindex, arrow keys, Enter/Space)
- **ARIA Attributes**: Using `aria-label`, `role`, and semantic HTML to communicate component structure and purpose to assistive technologies
- **Focus Management**: Maintaining focus position after state changes to prevent jarring user experience
- **Screen Reader Announcements**: Using live regions to announce state changes and card movements
- **Headless UI Components**: Leveraging libraries like Radix UI to handle complex keyboard interactions (menu navigation, focus trapping)
- **Visual Focus Indicators**: Providing clear CSS styling (outlines, rings) to show keyboard focus state

## Architecture / Approaches

### 1. **Semantic HTML + ARIA Enhancement**
- Convert non-interactive elements (divs) into keyboard-accessible elements using `tabindex="0"`
- Apply ARIA roles (`listbox`, `option`) to describe component hierarchy
- Use `aria-label` to provide context (card title + column name)
- **Trade-off**: Minimal overhead but requires careful role selection; incorrect roles confuse screen readers more than no roles

### 2. **Menu-Based Movement Pattern**
- Replace drag-only interaction with a dropdown menu accessible via keyboard
- Use Radix UI's `DropdownMenu` component to handle arrow key navigation, focus trapping, and Enter/Space selection automatically
- Dynamically generate menu items based on available columns
- **Trade-off**: Menu approach is more verbose than drag but provides better keyboard UX; requires additional library dependency but avoids reinventing complex keyboard behavior

### 3. **Focus Restoration via Context State**
- Maintain a `focusedCardId` state at the board context level (global state)
- When a card moves and re-renders, use `useEffect` with a ref to manually call `.focus()` on the card element
- Reset the `focusedCardId` after focus is restored to avoid stale focus
- **Trade-off**: Adds complexity to state management but prevents focus loss; alternative would be to use DOM queries to find the card, but context-based approach is more explicit and testable

### 4. **Screen Reader Announcements**
- Create an `announcement` state in board context
- Use a live region (implicit via ARIA announcements) to broadcast card movement events
- Trigger announcements when `moveCard` is called
- **Trade-off**: Requires additional state and coordination; simpler alternative would be inline aria-live regions on each card, but board-level announcements provide better UX for bulk operations

## Key Trade-offs

| Trade-off | Option A | Option B |
|-----------|----------|----------|
| **Interaction Model** | Drag-only (mouse) | Menu-based (keyboard + mouse) | Menu is more accessible but requires more UI real estate and clicks |
| **Focus Management** | Let browser handle (loses focus on re-render) | Explicit context-based restoration | Explicit approach prevents user frustration but adds state complexity |
| **Keyboard Navigation** | Custom implementation | Headless UI library (Radix) | Library handles edge cases (arrow keys, focus trapping, Escape) but adds dependency |
| **ARIA Roles** | Minimal (just aria-label) | Full semantic structure (listbox/option) | Full structure better for screen readers but requires correct role selection |
| **Announcements** | Inline aria-live on cards | Board-level announcement state | Board-level is cleaner for global events but requires context coordination |

## Common Interview Questions

1. **Why is `tabindex="0"` necessary on the card element, and what would happen with `tabindex="-1"`?**
   - Answer should explain that `tabindex="0"` makes the element focusable in natural tab order, while `-1` makes it focusable only programmatically (via `.focus()`), which breaks keyboard navigation.

2. **How does the focus restoration pattern work, and why can't we just rely on the browser's default focus behavior?**
   - Should explain that re-rendering destroys the DOM element, so focus is lost; context state + useEffect + ref allows us to restore focus to the new element after re-render.

3. **What is the purpose of the `onPointerDown` handler on the menu button, and why is it important?**
   - Answer should cover that it prevents the drag event from triggering when the user clicks the menu button, avoiding unintended drag behavior.

4. **Why use Radix UI's DropdownMenu instead of building a custom menu with keyboard support?**
   - Should discuss that Radix handles complex keyboard interactions (arrow navigation, focus trapping, Escape to close), preventing accessibility bugs and reducing code.

5. **How would you announce to screen readers that a card has been moved to a different column?**
   - Answer should mention using an announcement state in context, setting it when `moveCard` is called, and having a live region component that reads the announcement.

6. **What ARIA roles and attributes are used in this implementation, and what does each communicate?**
   - Should identify: `role="listbox"` (list of selectable items), `role="option"` (individual selectable item), `aria-label` (descriptive text for screen readers).

7. **How would you handle focus management if multiple cards are moved at once?**
   - Answer should discuss whether to focus the first moved card, the last, or use announcements instead; trade-offs between focus jumping and user awareness.

8. **What's the difference between keyboard navigation and screen reader announcements, and why do you need both?**
   - Should explain that keyboard nav makes the UI usable without a mouse, while announcements ensure screen reader users understand what happened (especially for async state changes).

## Evaluation Signals

**Strong Answer:**
- Understands the distinction between keyboard accessibility (navigation) and screen reader accessibility (announcements)
- Explains why focus management is necessary and how context state solves it
- Recognizes the value of headless UI libraries for complex keyboard behavior
- Discusses ARIA roles and attributes with correct semantics (not just adding aria-label everywhere)
- Considers edge cases (e.g., what happens when a card is deleted, or multiple cards move)
- Mentions testing with actual keyboard and screen reader tools

**Weak Answer:**
- Treats accessibility as an afterthought or "nice-to-have"
- Adds ARIA attributes without understanding their purpose
- Suggests custom keyboard handling instead of leveraging libraries
- Doesn't address focus management or announcements
- Confuses keyboard navigation with screen reader support
- No mention of testing or validation with assistive technologies