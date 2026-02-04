---
name: deslop
description: Remove AI-generated slop and align code to repo rules
disable-model-invocation: true
---

# Deslop (cleanup + align to repo rules)

Use this skill to clean up “AI slop” (duplicated code, inconsistent patterns, ad-hoc error handling, noisy comments) and bring changes back in line with this repo’s standards.

## Guardrails (do not break contracts)

- Do **not** change Prisma schema or DB migrations unless explicitly requested.
- Do **not** change public API behavior or endpoints unless explicitly requested.
- Preserve timezone handling logic and all-day date semantics.

## What to target (common slop signals)

- Duplicated logic across files (especially filter builders, parsing, response shaping)
- Ad-hoc `NextResponse.json(...)` error handling outside `AbstractController.errorResponse`
- Route handlers doing business logic instead of delegating to controllers
- Services returning HTTP responses instead of throwing domain errors
- Excessive `any`, `as any`, or “type escape hatches” where a small type fixes it
- Commented-out code, TODO/FIXME spam, “TEMP/HACK” narration
- Inconsistent naming (kebab-case vs camelCase paths, inconsistent resource naming)
- Unused imports, dead code, unused exports

## Canonical patterns to enforce in this repo

- **API shape**: `src/app/api/**/route.ts` delegates to `src/server/controllers/*Controller.ts`
- **Controllers**: parse inputs → call service → `successResponse` → `catch` → `errorResponse`
- **Services**: validation + normalization + business rules; throw domain errors (`ValidationError`, `ConflictError`, etc.)
- **Repositories**: Prisma access only; rely on `AbstractRepository` to translate Prisma errors to domain errors
- **Tests**: prefer abstract test factories + `MockPrisma` extensions for CRUD modules

## Workflow

### 1) Inventory and isolate the cleanup scope

- Identify the target area(s) (API module, component folder, utility, etc.).
- List the files that will be touched and confirm the cleanup won’t change external contracts.

### 2) Detect slop with quick searches

Look for:

- `TODO`, `FIXME`, `TEMP`, `HACK`
- `as any`, `any`, `console.log`, `debugger`
- route handlers containing business logic (`NextResponse.json`, direct Prisma access, heavy parsing)
- repeated filter builders and request parsing in multiple controllers

### 3) Refactor toward the repo’s shape

- Extract small helpers (e.g., `parseExpand`, filter builders, normalizers).
- Replace ad-hoc errors with domain errors + controller `errorResponse`.
- Remove dead/commented-out code (prefer deleting).
- Improve types at boundaries instead of broad `any`.

### 4) Verify behavior

- Run targeted tests for touched areas (prefer `tests/server/**` for API changes).
- Run lints for changed files only.

### 5) Ship

- Update `CHANGELOG.md` under **Unreleased** (1–3 bullets).
- Commit + open PR using the `suggest-commit-message` or `ship-it` workflow.
