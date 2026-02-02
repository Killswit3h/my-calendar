---
name: suggest-commit-message
description: Suggest commit message, update changelog, commit, and create a PR
disable-model-invocation: true
---

# Suggest commit message + ship (changelog, commit, PR)

Use this workflow to finalize a change set: propose a commit message, update the changelog, commit, push, and create a PR.

## 1) Inspect changes

- Run `git status --short` to see what will be committed.
- Run `git diff` (and `git diff --staged` if anything is staged) to understand the change set.
- If there are untracked files that should not be committed (e.g. local seeds, exports), leave them untracked.

## 2) Suggest a commit message

Generate a commit message that is:

- concise and specific
- focused on the “why” and the main change set

Prefer this format:

- Line 1: brief summary (imperative)
- Line 2+: short rationale / key changes (keep it short)

## 3) Update the changelog

- If `CHANGELOG.md` exists, add an entry under **Unreleased** describing the change in 1–3 bullets.
- If there is no changelog yet, create `CHANGELOG.md` with an **Unreleased** section and add the entry there.

## 4) Stage the right files

- Stage only the intended files (avoid secrets like `.env`, credential files, or large local data).
- If the change is purely developer tooling/docs (e.g. `.cursor/*`), stage only those files plus `CHANGELOG.md`.

## 5) Commit

- Commit with the message from step 2.
- Verify `git status` is clean after committing (except intentionally untracked files).

## 6) Push and create PR

- Push the current branch to origin (set upstream if needed).
- Create a PR with:
  - **Title** = commit summary
  - **Body**: short summary + test plan (even if “not run”)

### Creating the PR (two options)

**Option A: GitHub CLI (`gh`) is installed and authenticated**

- `gh pr create --title "<summary>" --body "<summary + test plan>"`

**Option B: No `gh` available**

- Push the branch, then open GitHub in the browser and use “Compare & pull request”.

If you can, include a changelog bullet in the PR summary.

---
name: suggest-commit-message
description: Suggest commit message, update changelog, commit, and create a PR
disable-model-invocation: true
---

# Suggest commit message + ship (changelog, commit, PR)

Use this workflow to finalize a change set: propose a commit message, update the changelog, commit, push, and create a PR.

## 1) Inspect changes

- Run `git status --short` to see what will be committed.
- Run `git diff` (and `git diff --staged` if anything is staged) to understand the change set.
- If there are untracked files that should not be committed (e.g. local seeds, exports), leave them untracked.

## 2) Suggest a commit message

Generate a commit message that is:

- concise and specific
- focused on the “why” and the main change set

Prefer this format:

- Line 1: brief summary (imperative)
- Line 2+: short rationale / key changes (keep it short)

## 3) Update the changelog

- If `CHANGELOG.md` exists, add an entry under **Unreleased** describing the change in 1–3 bullets.
- If there is no changelog yet, create `CHANGELOG.md` with an **Unreleased** section and add the entry there.

## 4) Stage the right files

- Stage only the intended files (avoid secrets like `.env`, credential files, or large local data).
- If the change is purely developer tooling/docs (e.g. `.cursor/*`), stage only those files plus `CHANGELOG.md`.

## 5) Commit

- Commit with the message from step 2.
- Verify `git status` is clean after committing (except intentionally untracked files).

## 6) Push and create PR

- Push the current branch to origin (set upstream if needed).
- Create a PR with:
  - **Title** = commit summary
  - **Body**: short summary + test plan (even if “not run”)

### Creating the PR (two options)

**Option A: GitHub CLI (`gh`) is installed and authenticated**

- `gh pr create --title "<summary>" --body "<summary + test plan>"`

**Option B: No `gh` available**

- Push the branch, then open GitHub in the browser and use “Compare & pull request”.

If you can, include a changelog bullet in the PR summary.
