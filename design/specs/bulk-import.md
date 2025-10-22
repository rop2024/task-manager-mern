# Bulk Import - Spec (Phase 0)

Purpose
-------
Provide a concise spec to lock down user flows, input formats, data model mapping, and the API contract for bulk-importing tasks from Markdown checklist lines.

Input formats
-------------
Primary input: Markdown checkbox lines. Each task is a single checklist line.

Supported checklist lines:
- `- [ ] Task title` — pending task
- `- [x] Task title` — completed task

Inline metadata (decided): Supported.
- Syntax: pipe-separated key:value pairs after the title, e.g.
  - `- [ ] Buy groceries | priority:medium | group:Personal | due:2025-10-30 | tags:errands,shopping | estimatedMinutes:30`
- Supported metadata keys (case-insensitive): `priority`, `group`, `due`, `dueAt`, `tags`, `estimatedMinutes`, `description`.
- Tags are comma-separated. `due`/`dueAt` accepts ISO date (YYYY-MM-DD or full ISO). `priority` accepts `low`, `medium`, `high`.

Decision: Inline metadata WILL be supported in this phase to enable power-users and reduce UI work. The client grid will also allow editing/overriding parsed metadata before import.

Data model mapping
------------------
Parsed fields map to Task model fields as follows:
- title -> `title` (string) [required]
- status -> `status` ("pending" | "completed") derived from checkbox state
- description -> `description` (string | null)
- priority -> `priority` ("low" | "medium" | "high")
- group -> `group` (group name or ObjectId). Server will attempt to resolve group name to id; if missing or not resolvable, assign user's default group.
- due/dueAt -> `dueAt` (Date | null)
- tags -> `tags` (string[])
- estimatedMinutes -> `estimatedMinutes` (Number | null)

Target grid columns (visible to user for review/edit before import):
- title, description, status, priority, group, dueAt, tags, estimatedMinutes

Bulk insert behavior
--------------------
- Two-step flow:
  1. Parse: `POST /api/tasks/bulk/parse` — accepts Markdown or text body, returns parsed rows (no DB writes).
  2. Import: `POST /api/tasks/bulk/import` — accepts array of task objects (as edited in grid) and writes to DB.
- Limit: Default 50 items per request (server-configurable). Larger uploads must be split client-side.
- Atomicity: Partial success allowed. Server will try to insert valid items and return per-item errors for invalid ones. Client shows successes and failures and may retry failed rows.
- Validation: required `title`. `group` may be a name (resolved) or id. Date parsing tolerant of `YYYY-MM-DD` and ISO timestamp.
- Insert method: `insertMany` in batches. Use unique checks or dedupe logic if necessary (not in Phase 0).

API Contract (examples)
-----------------------
Base URL: /api

1) Parse Markdown (no DB write)
- POST /api/tasks/bulk/parse
- Content-Type: text/plain
- Body: Markdown checklist text
- Response: 200 OK
  - success: boolean
  - count: number
  - data: array of objects: { line: string, parsed: { title, status, priority, group, dueAt, tags, estimatedMinutes, description }, errors: [] }

2) Import parsed tasks (writes to DB)
- POST /api/tasks/bulk/import
- Content-Type: application/json
- Body: { tasks: [ { title, description?, status?, priority?, group?, dueAt?, tags?, estimatedMinutes? } ] }
- Response: 201 Created
  - success: boolean
  - createdCount: number
  - data: created task objects (with ids)
  - errors: per-item errors with index and message

3) Upload Markdown file (optional)
- POST /api/tasks/bulk/upload-file
- Content-Type: multipart/form-data
- Field: `file` (single `.md` file)
- Response: same shape as parse endpoint

Edge cases
----------
- Empty lines, non-checklist lines: ignored with warning in response
- Lines missing title or malformed metadata: returned with per-item error and omitted from create
- Too many items: 413 or 400 with message to split requests
- Ambiguous group names: attempt resolve; if multiple matches, prefer exact name then primary user group; return a warning

Security and rate limiting
-------------------------
- Endpoints require JWT auth
- Bulk operations limited to default 50 items per request
- Rate limiter applies same as other bulk routes (configurable)

Success criteria
----------------
- Spec and API contract present in repo (`design/specs/bulk-import.md` and `docs/api.md` updated)
- Team agrees on inline metadata format (we chose to support pipe-separated key:value inline metadata for Phase 0)

Next steps (implementation guidance)
-----------------------------------
- Implement parser utility (server-side) with tests for metadata variations
- Implement `POST /tasks/bulk/parse` + `/upload-file` endpoints
- Implement `/tasks/bulk/import` endpoint to validate and insert in batches
- Client: Add Import UI to allow paste/upload, preview grid, edit and submit

Created: 2025-10-22
Author: spec generator
