---
name: write-spec
description: Write a .cursor/specs spec (projectEndpoint-style)
disable-model-invocation: true
---

Use this workflow to write a repo-native spec in `.cursor/specs/` that matches the structure and level of detail of `projectEndpoint.md`.

## 1) Decide the spec file name

- Create a single markdown file at: `.cursor/specs/<feature>.md`
- Use lowerCamelCase or lower-kebab-case consistently with existing specs (example: `projectEndpoint.md`).

## 2) Analyze requirements and context

- Read any user-provided description, constraints, and acceptance criteria.
- Identify what is explicitly **in scope** and **out of scope**.

## 3) Search for existing code to leverage (mandatory)

Before writing requirements, search for existing patterns to reuse:

- Similar API routes under `src/app/api/**/route.ts`
- Similar controllers/services/repositories under `src/server/**`
- Related tests under `tests/server/**` (especially the abstract test factories)
- Existing domain errors and base classes under `src/server/base/**`

Write down the concrete files you found in the spec under **Existing Code to Leverage**.

## 4) Write the spec (use the repo template + projectEndpoint style)

Use `.cursor/specs/spec-template.md` as the baseline structure, and follow `projectEndpoint.md` as the style reference (explicit file paths, explicit validation, explicit error semantics, explicit tests).

Write the spec content in this shape:

```markdown
# Specification: [Feature Name]

## Goal

[1-2 sentences describing the core objective]

## User Stories

- As a [user type], I want to [action] so that [benefit]
- [Optional] Additional user story (max two total)

## Specific Requirements

**[Requirement name]**

- [Up to 8 concise bullets; include file paths and exact behavior]

[Repeat for up to 10 requirements]

## Visual Design

N/A

## Existing Code to Leverage

**[Code/logic/component name]**

- [Up to 5 bullets describing what exists and how to reuse it]

[Repeat up to 5 code areas]

## Testing Requirements

**Test Structure**

- [What layers/files need tests: controller/service/repository/e2e]

**What Gets Tested**

- [Core flows + critical validation/error behavior]

## Out of Scope

- [Up to 10 concise “do not build” bullets]
```

## 5) Quality bar for specs (what makes them “consistent”)

To match the `projectEndpoint.md` standard, include:

- exact file paths to add/change
- field-by-field validation rules (type, requiredness, trimming, length, defaults)
- error semantics (status codes + what triggers them)
- testing plan (which tests to add and what they cover)
- explicit out-of-scope items

## 6) Final confirmation message

After writing the spec, tell the user:

```
The spec has been created at `.cursor/specs/<feature>.md`.

Review it closely to ensure everything aligns with your vision and requirements.
```
