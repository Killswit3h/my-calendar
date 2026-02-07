---
name: generate-spec
description: Generate a comprehensive specification document for recently implemented changes. Serves as a reference for future AI agents to understand patterns, architecture, expectations, and structure.
---

# Generate Spec (`/generate-spec`)

Use this workflow to generate a comprehensive specification document for recently implemented changes. The spec document serves as a reference for future AI agents to understand patterns, architecture, expectations, and structure.

Specification documents live in `docs/specs/`.

---

## When to Update Documentation

### Update `docs/specs/`

- Introducing new architectural patterns
- Adding new components or modules
- Modifying navigation or routing
- Changing state management patterns
- Adding new providers or services

### Update `docs/runbook`

- Environment variable changes
- Setup requirements change
- New config procedures are needed
- Troubleshooting steps change

---

## Documentation Principles

- **Update docs when code changes** — Don't let documentation drift from implementation
- **Don't duplicate information across files** — Reference related specs and runbook pages instead
- **Code examples must match implementation** — Complete and accurate for easy contextual understanding

---

## Input Required

To generate a spec, the AI needs:

1. **Scope** — What feature/component to document
2. **Changed files** — List of files modified or added (or use `git diff main...HEAD --name-only` for branch scope)
3. **Context** — Any decisions that were made, constraints, or rationale

---

## Process

1. **Analyze changed files** — Read and understand the implementation
2. **Identify patterns** — Note reusable patterns, conventions, and architecture
3. **Determine spec type** — New feature, modification, or update
4. **Check for existing specs** — Search `docs/specs/` for related documents
5. **Generate document** — Follow the template below
6. **Save document** — Use format `YYYYMMDD_<title>.md` (e.g. `20260206_project-pay-items-api.md`)

---

## Handling Existing Specs

### When to create a new spec

- Implementing a **new feature** (no existing spec covers this functionality)
- Modifying existing functionality (changes are significant enough that the old spec is no longer accurate)
- Previous spec exists from a different effort (existing spec documents a stable shipped feature)

**When creating a new spec that modifies previously documented functionality:**
- Reference the previous spec in the new document
- Clearly describe what changed and why
- Include a **"Changes from Previous Implementation"** section

### When to update an existing spec

- Same effort/session
- Minor additions
- Bug fixes

---

## Specification Document Template

Each specification document should include the following sections. Remove sections that don't apply, and add any custom sections specific to the document.

### 1. Title and Metadata

```markdown
# [Feature/Component Name] Specification

| Field | Value |
|-------|-------|
| Date | YYYY-MM-DD |
| Feature | [Feature name] |
| Component | [Component/module name] |
```

### 2. Table of Contents

- List all level 2 sections as markdown anchor links
- Place **before** the Overview section
- Use format: `- [Section Name](#section-name)`
- Remove sections that don't apply; add custom sections as needed

### 3. Overview

- High-level summary of what was implemented and why
- Include: the feature/component being documented
- Purpose it serves
- How it fits into the broader system

### 4. Problem Statement

- Describe the problem that was solved
- What issues existed before this implementation?
- What was inconsistent, missing, or broken?
- Why was the change necessary?

### 5. Solution

- Describe the solution at a high level
- Why was this approach taken?
- What were the key design decisions?

### 6. Architecture

- File locations
- Component design
- Visual diagrams (ASCII when helpful)

Example ASCII diagram:

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  route.ts       │────▶│  Controller      │────▶│  Service           │
│  GET/POST       │     │  handleGet/Post  │     │  list/create       │
└─────────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  Repository        │
                                                 │  findMany/create   │
                                                 └────────────────────┘
```

### 7. Implementation Patterns

Document reusable patterns with:

- **Pattern name**
- **Concept** — What it does and why
- **Implementation** — How it's implemented
- **When to use it** — Appropriate contexts

For each pattern, include:
- Code example (must match actual implementation)
- File references with line numbers when helpful
- Benefits
- Caveats or considerations

### 8. Visual/Behavioral Specs (if applicable)

For UI components, include:

- Styling specs
- Responsive behavior / breakpoints
- Animation specs
- Accessibility requirements

### 9. Future Improvement Guidelines

- Clear guidance for developers extending this work
- Suggested next steps
- Known limitations or tech debt

### 10. Changes from Previous Implementation (if applicable)

When the spec supersedes or significantly modifies a previous spec:

- Reference the previous spec
- List what changed and why
- Migration or compatibility notes

---

## Example Spec Structure

```markdown
# Project Pay Items API Specification

| Field | Value |
|-------|-------|
| Date | 2026-02-06 |
| Feature | Project Pay Items CRUD |
| Component | API / Backend |

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Implementation Patterns](#implementation-patterns)
- [Future Improvement Guidelines](#future-improvement-guidelines)

## Overview

...

## Problem Statement

...

## Solution

...

## Architecture

...

## Implementation Patterns

...

## Future Improvement Guidelines

...
```

---

## Final Confirmation

After generating the spec, tell the user:

```
The spec has been created at docs/specs/YYYYMMDD_<title>.md.

Review it closely to ensure it accurately reflects the implementation and serves as a useful reference for future agents.
```
