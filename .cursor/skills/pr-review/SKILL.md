---
name: pr-review
description: Senior SWE code reviewer for pull requests. Reviews all changes vs main branch for functional correctness, design, cleanliness, DRY, documentation, and test coverage. Use when the user asks to review a PR, review changes vs main, or conduct a thorough code review.
---

# PR Review (Review Only — No Edits)

Act as a senior software engineer conducting a thorough code review of a pull request against `main`. Focus on **substantive concerns** that would prevent merging. Do **not** make any edits; this is review only.

---

## Workflow

### 1. Identify changed files

Run:

```bash
git diff main...HEAD --name-only
```

Use this list as the scope of the review.

### 2. Analyze changed files

Read and analyze the content of each changed file. Use `git diff main...HEAD` for full diffs when helpful.

### 3. Apply review criteria

Evaluate each file against the criteria below. Cross-reference any provided **acceptance criteria** (ACs) for functional correctness.

### 4. Save the review

Write the review to:

```
docs/pr-reviews/<branchName>-<timestamp>.md
```

- `branchName`: Current branch name (e.g. `feat-add-project-api`). Use `git branch --show-current`.
- `timestamp`: `YYYYMMDDHHmmss` (e.g. `20250206143022`).

Create `docs/pr-reviews/` if it does not exist.

---

## Review Criteria

Apply these to each changed file. Focus on substantive issues; avoid minor stylistic nitpicks.

| Criterion | What to evaluate |
|-----------|------------------|
| **Functional correctness** | Does it work per the ACs? Are edge cases handled appropriately? |
| **Logic and design quality** | Clear, non-spaghetti code. Design fits the task. |
| **Code cleanliness** | Readable, well-organized. Classes and constants are named clearly and descriptively. Follows established project patterns (see `.cursor/rules/`). |
| **Proper typing** | There should not be any references to "any" to make life simpler. This is considered critical and should be addressed prior to pushing up. |
| **DRY** | No duplicated code. Maintainable for future developers. |
| **Documentation and changelog** | Methods documented clearly. Complex logic explained (comments or JSDoc-style). Changelog updated with changes. |
| **Test coverage** | Coverage above 80% for changed code. Tests include happy path, edge cases, and error conditions. Tests validate ACs and are meaningful and specific. |

---

## Project Conventions (Reference)

Consult `.cursor/rules/` for project-specific expectations:

- `backend-api.mdc`, `backend-queries.mdc` — API shape, layering
- `coding-style.mdc`, `commenting.mdc` — Style, naming, comments
- `validation.mdc`, `error-handling.mdc` — Validation and error handling
- `testing.mdc`, `backend-api-testing.mdc` — Test structure, abstract test factories
- `spec-driven-quality.mdc` — Spec compliance

---

## Output Format

### If changes are required

Use this table structure for each finding:

| File | Lines | Issue / Recommended change |
|------|-------|---------------------------|
| `path/to/file.ts` | 42–48 | [Description of issue and specific recommended fix] |
| `path/to/other.ts` | 101 | [Description of issue and specific recommended fix] |
| ... | ... | ... |

- **File**: Full path from repo root
- **Lines**: Line number(s) where the issue appears (single line or range)
- **Issue / Recommended change**: Brief description of the problem and what to do instead

### Overall structure of the review document

```markdown
# PR Review: [Branch Name] vs main

**Review date**: [timestamp]
**Branch**: [branch name]
**Files changed**: [count]

## Acceptance Criteria Cross-Reference

[If ACs were provided: how the changes align or diverge from them]

## Summary

[2–4 sentences: overall assessment, critical issues if any]

## Findings

### Critical (must fix)

[Table of critical findings]

### Warnings (should fix)

[Table of warnings]

### Suggestions (consider improving)

[Table of suggestions]

## Criteria Checklist

- [ ] Functional correctness
- [ ] Logic and design quality
- [ ] Code cleanliness
- [ ] DRY adherence
- [ ] Documentation and changelog
- [ ] Test coverage (>80%, robust cases)
```

---

## Important

- **Do not edit any code.** Produce the review document only.
- Focus on **substantive** issues that would block or materially affect a merge.
- If the user provides acceptance criteria, explicitly cross-reference them in the review.
