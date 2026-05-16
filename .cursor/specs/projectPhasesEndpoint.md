# Project pay application phases API

| Field | Value |
|-------|-------|
| Date | 2026-04-06 |
| Scope | Nested Phases tab persistence (separate from Contract tab save) |

## Routes

- `GET /api/projects/[id]/phases` — list all phases for the project with lines.
- `PUT /api/projects/[id]/phases` — replace the entire phase tree for the project (transactional).

Thin handlers: [`src/app/api/projects/[id]/phases/route.ts`](../../src/app/api/projects/[id]/phases/route.ts).  
Server: [`ProjectPhaseController`](../../src/server/controllers/ProjectPhaseController.ts), [`ProjectPhaseService`](../../src/server/services/ProjectPhaseService.ts), [`ProjectPhaseRepository`](../../src/server/repositories/ProjectPhaseRepository.ts).

## Data model

- `project_phase`: per-project grouping (`name`, ordering, locate/dates/booleans/status/notes).
- `project_phase_line`: links one `project_pay_item` to a phase with `phase_quantity`, optional `line_description` (`Text`).
- **Per phase:** `@@unique([phase_id, project_pay_item_id])` — at most one row per pay item **in each phase**.
- **Allocation:** for each `project_pay_item`, the **sum of `phase_quantity` across all phases** must be **≤** `project_pay_item.contracted_quantity`. Unallocated remainder is allowed. PUT rejects over-allocation with `400` / `ValidationError`.

## GET response shape

```json
{
  "phases": [
    {
      "id": 1,
      "project_id": 10,
      "sort_order": 0,
      "name": "Phase 1",
      "locate_ticket": null,
      "date_created": "2025-12-01",
      "ready_to_work_date": null,
      "onsite_review": false,
      "surveyed": false,
      "status": "Pending",
      "status_date": null,
      "notes": null,
      "lines": [
        {
          "id": 1,
          "project_pay_item_id": 42,
          "phase_quantity": "100.00",
          "sort_order": 0,
          "line_description": "Optional note for this line in this phase"
        }
      ]
    }
  ]
}
```

Date fields are `YYYY-MM-DD` strings or `null`. Decimals are serialized as strings for JSON stability.

## PUT body shape

Same as each element inside `phases` but **omit** `id`, `project_id`, and line `id` (server assigns on replace).

```json
{
  "phases": [
    {
      "sort_order": 0,
      "name": "Phase 1",
      "locate_ticket": "",
      "date_created": "2025-12-01",
      "ready_to_work_date": null,
      "onsite_review": true,
      "surveyed": false,
      "status": "Ready",
      "status_date": "2025-12-05",
      "notes": "Optional",
      "lines": [
        {
          "project_pay_item_id": 42,
          "phase_quantity": 100,
          "sort_order": 0,
          "line_description": "Optional; omit or null to clear"
        }
      ]
    }
  ]
}
```

**Semantics:** delete all existing `project_phase` rows (and cascading lines) for this project, then insert the provided phases and lines. Omitted optional fields use defaults (`false` for booleans, `null` for nullable strings/dates).

## Validation

- `phases` must be an array (may be empty).
- Each phase: `name` required, non-empty after trim, max 255; `sort_order` integer ≥ 0.
- Each line: `project_pay_item_id` positive integer; `project_pay_item` must exist and belong to the same `project_id` as the path; `phase_quantity` finite, ≥ 0; `sort_order` integer ≥ 0.
- **`line_description`:** optional string or `null`; if string, trim; max 2000 characters; empty after trim stored as `null`.
- **Duplicate** `project_pay_item_id` **within the same phase** → `400` ValidationError.
- **Duplicate** `project_pay_item_id` **across different phases** is **allowed** (split quantities).
- **Allocation:** if for any pay item the sum of `phase_quantity` over all lines in the payload **exceeds** that row’s `contracted_quantity` → `400` ValidationError.
- Invalid dates → `400`.

## Error semantics

| Condition | Code | HTTP |
|-----------|------|------|
| Invalid JSON | VALIDATION_ERROR | 400 |
| Validation failed | VALIDATION_ERROR | 400 |
| Project not found | NOT_FOUND | 404 |
| Pay item wrong project / missing | VALIDATION_ERROR | 400 |

## Out of scope

- Contract tab (`PayApplicationContractView`) and `PATCH /api/projects` payload unchanged for phases.
- Installed quantities: still read-only from `event_quantity` rollups on the client; not written by this API.
- Autosave; phases save only via explicit **Save phases** in the UI.

## Tests

- `tests/server/services/ProjectPhaseService.test.ts` — replace, per-phase duplicates, allocation across phases, wrong-project pay item.
- `tests/server/controllers/ProjectPhaseController.test.ts` — GET 404, PUT 400, PUT success.
- `tests/app/projects/buildPhasesPutPayload.test.ts` — client payload includes `line_description`.
