## Documentation Maintenance

This file describes when and how to update the documentation in `docs/` after making changes to the nodes.

---

## Source of Truth

The nodes are defined in:

| File | What it defines |
|---|---|
| `nodes/Worktables/Worktables.node.ts` | All resources, operations, parameters, and execution logic for the main Worktables node |
| `nodes/Worktables/MondayWebhook.node.ts` | The Worktables Webhook trigger node |
| `utils/worktablesHelpers.ts` | Column formatting helpers (affects output shape docs) |

The documentation lives in `docs/`. The mapping between source and docs is:

| Source change area | Doc file to update |
|---|---|
| `resource: 'board'` — any operation or field | `docs/board.md` |
| `resource: 'item'` or `resource: 'subitem'` | `docs/item.md` |
| `resource: 'update'` | `docs/update.md` |
| `resource: 'team'` | `docs/team.md` |
| `resource: 'user'` | `docs/user.md` |
| `resource: 'notification'` | `docs/notification.md` |
| `resource: 'query'` or `resource: 'downloadFile'` | `docs/query.md` |
| `MondayWebhook.node.ts` | `docs/webhook.md` |
| `columnType` options in `columnValues` | `docs/column-values.md` |
| Adding/removing a resource or node | `docs/README.md` + the relevant resource file |

---

## When to Update Documentation

Update docs whenever you make any of the following changes to a node:

- **New operation added** — add a full section to the relevant resource file
- **Operation removed or renamed** — remove or rename the section; update the operations table at the top of the file
- **New parameter added** — add a row to the parameter table and update the JSON example for that operation
- **Parameter removed** — remove the row and update the JSON example
- **Parameter renamed** — update the key name in the parameter table and all JSON examples that reference it
- **Parameter type changed** — update the Type column and any format notes
- **Default value changed** — update the Default column
- **New option added to an options/multiOptions field** — add the value to the options table or list in that section
- **Option removed from an options field** — remove it from the table
- **New column type supported** — add a full section to `docs/column-values.md`
- **New resource added** — create a new doc file for it, add it to the table in `docs/README.md`
- **Node renamed or new node added** — update `docs/README.md` and create/rename the relevant doc file
- **Output shape changed** — update any output examples in the relevant doc file
- **Webhook output format changed** — update `docs/webhook.md` output section

---

## Step-by-Step Process

### 1. Identify what changed

Read the diff carefully. For each changed property definition in the `properties` array of the node, note:
- The `name` field — this is the JSON key used in `parameters`
- The `displayName` — this is what the user sees in the UI (use it in the "Parameter" column of tables)
- The `type` — string, number, boolean, options, multiOptions, fixedCollection, etc.
- The `default` value
- The `options` array (for options/multiOptions types)
- The `displayOptions.show` conditions — determines which operation(s) this field belongs to

### 2. Locate the right doc file

Use the mapping table above. If a field appears under multiple operations that span different resources, update each relevant file.

### 3. Update the operations table

At the top of each resource doc file there is an operations table. If an operation was added or removed, update that table first.

### 4. Update the parameter table

Each operation section has a parameter table. Columns are:

```
| Parameter | Key | Type | Default | Notes |
```

- **Parameter** — the `displayName` from the node source
- **Key** — the `name` from the node source (the JSON key used in `parameters`)
- **Type** — the field type: `string`, `number`, `boolean`, `options`, `multiOptions`, `fixedCollection`, `dateTime`
- **Default** — the `default` value from the source, formatted as inline code
- **Notes** — constraints, dependencies, option values if short, or a cross-reference

If a table has no Default column (simple operations), omit it rather than leaving it blank throughout.

### 5. Update the JSON example

Every operation section has at least one JSON example showing the `parameters` object. Rules:

- Always show a **complete, runnable example** — include all required fields plus the most common optional ones
- Omit fields that are `false`, `""`, or their default value only if they're truly rarely changed
- If an operation has meaningfully different configurations (e.g. with and without subitems), show multiple examples with a heading above each
- Use realistic-looking values (real-looking IDs, real column names) — do not use placeholder strings like `"YOUR_BOARD_ID"`
- Keep the format consistent with existing examples: two-space indentation, string values in double quotes

### 6. Update `docs/README.md` if needed

Update `docs/README.md` when:
- A new resource is added (update the "Node Reference" table)
- A new node is added (update the "Available Nodes" table)
- A new tip is relevant to multiple resources (add to Tips & Tricks)
- A new common pitfall is found (add to Common Pitfalls)

---

## Style Conventions

- **Option values** in tables: wrap in backtick code spans, e.g. `` `"public"` ``
- **Parameter keys** in prose: wrap in backtick code spans, e.g. `` `boardId` ``
- **Boolean defaults**: write as `` `false` `` or `` `true` ``
- **"Required"** vs **"—"**: use "Required" in the Notes column only when the field is truly required by the node (`required: true` in source). Otherwise leave Notes blank or describe the condition.
- **Blockquotes** (`>`) for warnings, edge cases, and important notes that don't fit in a table row
- **Cross-references**: link to other doc files with relative markdown links, e.g. `[column-values.md](./column-values.md)`
- Do not add emojis, decorative headers, or marketing language

---

## Checking Your Work

After updating docs, verify:

1. Every new `name` field in the node source appears as a **Key** in the parameter table of the right operation section
2. Every removed field is gone from all parameter tables and JSON examples
3. Every JSON example is valid JSON (no trailing commas, correct brackets)
4. The operations table at the top of the file matches the actual available operations
5. If you added a new resource file, it is listed in `docs/README.md`

---

## What NOT to Document Here

- Internal implementation details (GraphQL query strings, helper function logic)
- n8n platform behavior unrelated to these specific nodes
- Anything already covered by the Monday.com API documentation
- Credential setup steps (covered in `docs/README.md` — keep that section minimal)
