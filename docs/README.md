# Worktables n8n Nodes — Documentation

This package provides two n8n nodes for interacting with **Monday.com** via its GraphQL API.

---

## Available Nodes

| Node | Type | Description |
|---|---|---|
| `Worktables` | Action | Reads and writes data in Monday.com (boards, items, updates, teams, users, etc.) |
| `Worktables Webhook` | Trigger | Receives Monday.com webhook events and optionally fetches the related item |

---

## Node Reference

| File | Covers |
|---|---|
| [board.md](./board.md) | All Board resource operations |
| [item.md](./item.md) | Item and Subitem resource operations, column value mapping |
| [update.md](./update.md) | Update resource operations (create, edit, pin, upload) |
| [team.md](./team.md) | Team resource operations |
| [user.md](./user.md) | User resource operations |
| [notification.md](./notification.md) | Sending notifications |
| [query.md](./query.md) | Raw GraphQL API queries + file downloads |
| [webhook.md](./webhook.md) | Worktables Webhook trigger node |
| [column-values.md](./column-values.md) | Column type reference and JSON examples |

---

## Credentials

Both nodes use the `WorktablesApi` credential, which requires a **Monday.com API token**.

```json
"credentials": {
  "WorktablesApi": {
    "id": "<credential-id>",
    "name": "<credential-name>"
  }
}
```

The Webhook node can operate without credentials for raw event pass-through, but requires them if **Get Item After Event** is enabled.

---

## How Node JSON Parameters Work

Every n8n node configuration follows this shape:

```json
{
  "parameters": { ... },
  "type": "@worktables/n8n-nodes-worktables.worktables",
  "typeVersion": 1,
  "position": [0, 0],
  "id": "<uuid>",
  "name": "My Node",
  "credentials": {
    "WorktablesApi": { "id": "...", "name": "..." }
  }
}
```

The `parameters` object is what changes per operation. Only `resource` and `operation` are required at minimum — all other fields fall back to their defaults when omitted.

**Dynamic fields** (dropdowns loaded from the API) accept either the real ID as a string or an expression like `"=8886337654"`. Both forms work the same way at runtime.

---

## Tips & Tricks

### Use expressions for dynamic IDs

Any field that normally shows a dropdown can be overridden with an expression. Use `=` prefix to mark it as an expression:

```json
"boardId": "={{ $json.boardId }}"
```

### Comma-separated IDs

Several filter fields accept multiple IDs as a comma-separated string:

```json
"columnIdsFilter": "status, date4, person",
"itemIds": "1234567890, 9876543210"
```

### Limit 0 = fetch all

Wherever a `limit` field exists, setting it to `0` tells the node to paginate automatically and return every record. Use with care on large boards.

### Column IDs vs Column Titles

The API always uses the **column ID** (e.g. `status`, `date4`, `text_mkq0ckhb`), not the display title. You can find the ID by using **Get a Board** or **List Board's Groups** and inspecting the `columns` array in the output.

### Item vs Subitem

Most item operations work for both items and subitems. The key toggle is `isSubitem`. When `true`:
- `boardId` should point to the **parent board** (not the subitems board)
- `parentId` identifies the parent item
- Column options are loaded from the hidden subitems board automatically

### createOrUpdateItem

This is the most powerful item operation. Set an `identifierColumn` (any non-read-only column) and an `identifierValue`. If a matching item is found it will be updated; otherwise a new item is created. Leave `itemIdOptional` empty to always create.

### searchItems filter rules

Multiple rules are joined by the `logicalOperator` (`and`/`or`). Each rule targets one column. The `compareAttribute` field is optional and column-type-dependent (e.g. use `"text"` for status columns to compare against the label string).

### Upload files

- **uploadItemFile** uploads binary data to a `file`-type column on an item.
- **uploadFile** (Update resource) attaches binary data to an update post.
- Set `binaryPropertyName` / `attachmentsUpdate` to the n8n binary field name(s), comma-separated for multiple files.

### Raw API Query

When no built-in operation fits your need, use **Resource: Query → Run API**. You can write any Monday.com GraphQL query or mutation directly. Enable `includePagination` to auto-page cursor or page-based queries.

### Webhook Challenge Handshake

Monday.com sends a `challenge` field when first registering a webhook. The **Worktables Webhook** node handles this automatically — no action needed on your side.

---

## API Version

The nodes use Monday.com API version `2026-01` by default. You can override this only in the **Query** resource via the `apiVersion` parameter.

---

## Common Pitfalls

- **Board ID vs Workspace ID**: `boardId` and `workspace` are separate fields. Never pass a workspace ID as a board ID.
- **Subitem board**: Subitems live on a separate hidden board (named "Subitems of …"). You do **not** need to know this board's ID — just use the parent board ID and set `isSubitem: true`.
- **Status column values**: Status labels are stored by index internally. Use the `simple` column type with the label text (e.g. `"Done"`) and the node handles the conversion. Or use `objectValue` with `{ "label": "Done" }`.
- **File columns**: Only `file`-type columns appear in the File Column dropdown for `uploadItemFile`. Other column types are filtered out.
- **People column**: Accepts both users (`peopleValue`) and teams (`teamsValue`) in the same column entry.
