---
name: generate-plan
description: Creates comprehensive implementation plans for Cursor plan mode. Breaks work into small, testable, incremental steps. Use when in plan mode, when the user requests an implementation plan, or when breaking down a feature into executable tasks.
---

# Generate Plan

Use this skill when in plan mode or when asked to produce an implementation plan. Produce a plan that can be executed incrementally with clear validation at each step.

---

## Pre-Planning: Gather Context First

Before drafting the plan, **read and absorb** the following in order:

1. **README** — Project overview, setup, conventions, tech stack
2. **Specs** — `.cursor/specs/*.md` relevant to the feature (e.g. `projectEndpoint.md`-style specs)
3. **Rules** — `.cursor/rules/*.mdc` for coding style, architecture, testing, validation, API shape
4. **Existing code** — Search for related routes, controllers, services, repositories, tests to reuse

Document briefly what you learned under a **Pre-Planning Summary** section (1–2 sentences per area) so the plan is grounded in project reality.

---

## Plan Structure (Required Template)

Use this structure for every plan. Fill every section; omit only when explicitly N/A.

```markdown
# [Plan Title]

## Overview

[2–4 sentences describing the goal, scope, and high-level approach. What are we building and why?]

## Pre-Planning Summary

- **README / project context**: [Brief note]
- **Relevant specs**: [Which specs, key constraints]
- **Rules / conventions**: [Architecture, testing, validation expectations]
- **Existing code to leverage**: [Files, patterns, test factories]

## Key Changes

| Change | Description |
|--------|-------------|
| [Change 1] | [Short 1-line description] |
| [Change 2] | [Short 1-line description] |
| ... | ... |

## Breaking Changes Identified

- [List any API, schema, or behavioral changes that may affect existing consumers]
- Use "None identified" if there are none.

## Implementation Steps

Each step must be independently completable and testable.

### Step 1: [Clear Descriptive Title] — [Status: Pending | In Progress | Complete]

**Step Content (if Pending/Not Started):**
- [Concrete actions to take]
- [Files to create or modify]
- [Dependencies from previous steps]

**Step Content (if Complete):**
- [Summary of what was implemented]

**Step Completion Requirements:**
- [ ] [How to validate — e.g. "Run `npm test tests/server/controllers/FooController.test.ts`"]
- [ ] [Any manual verification or smoke test]
- [ ] [Definition of done for this step]

### Step 2: [Clear Descriptive Title] — [Status: Pending | In Progress | Complete]

[Same structure as Step 1]

...repeat for all steps...

## Best Practice Adherence

- **Rules referenced**: [List rules from `.cursor/rules/` that apply: e.g. backend-api.mdc, validation.mdc, testing.mdc]
- **Subagents to consider**: [If applicable, suggest subagents from `.cursor/agents/` or `~/.cursor/agents/` for code review, debugging, or domain-specific tasks]
- **Conventions**: [Project-specific conventions from specs/rules that must be followed]

## Testing Strategy

- **Unit tests**: [Which layers — controller, service, repository — and what to test]
- **Integration / E2E**: [If applicable]
- **Manual verification**: [Any manual checks needed]
- **Test execution**: [Command to run tests, e.g. `npm test` or `pnpm test`]

## Potential Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to reduce or handle it] |
| [Risk 2] | [How to reduce or handle it] |
| ... | ... |

## Clarifications Provided

- [Q: User question or open point]
  - A: [Answer or decision documented]
- Use "None" if no clarifications were needed.
```

---

## Implementation Step Guidelines

### Step Design

- **Small and atomic**: One step = one logical unit (e.g. "Add repository method", "Add validation in service")
- **Ordered by dependency**: Steps that create types, base classes, or shared logic come first
- **Independently testable**: Each step should have a concrete completion requirement (tests, command, or manual check)
- **Clear status**: Use `Pending`, `In Progress`, or `Complete` so progress can be tracked

### Completion Requirements

For each step, specify at least one of:

1. **Automated test**: `npm test path/to/test.file.ts`
2. **Lint/build**: `npm run lint`, `npm run build`
3. **Manual verification**: "Confirm X works in UI" or "Smoke test endpoint with curl"
4. **Definition of done**: Explicit criteria (e.g. "All validation rules from spec are implemented")

---

## Best Practices Checklist

Before finalizing the plan:

- [ ] Pre-planning section reflects actual README, specs, and rules
- [ ] Steps are small, ordered, and have explicit completion requirements
- [ ] Breaking changes are called out (or "None identified")
- [ ] Rules and subagents are referenced where relevant
- [ ] Testing strategy aligns with project conventions (e.g. abstract test factories)
- [ ] Risks have concrete mitigations
- [ ] Clarifications from planning conversation are documented

---

## Example Step Format

**Good:**
```markdown
### Step 3: Add ProjectService validation for name uniqueness — Pending

**Step Content:**
- Add `findByName` helper in ProjectRepository
- In ProjectService.beforeCreate, check name uniqueness
- Throw ConflictError if duplicate name

**Step Completion Requirements:**
- [ ] Run `npm test tests/server/services/ProjectService.test.ts`
- [ ] Test covers duplicate-name case
```

**Avoid:**
```markdown
### Step 3: Do validation — Pending
- Add some validation
```
