# Query Resource & Download File

This file covers two simple resources that don't fit under the standard board/item model.

---

## Query Resource

**Resource value:** `"query"`

Run raw Monday.com GraphQL queries or mutations directly. Use this when no built-in operation covers your need.

### Operation: Run API

**Operation value:** `"query"`

```json
{
  "parameters": {
    "resource": "query",
    "operation": "query",
    "runQuery": "{ boards(limit: 5) { id name } }",
    "apiVersion": "2026-01",
    "includePagination": false
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Query | `runQuery` | string | — | Full GraphQL query or mutation text |
| API Version | `apiVersion` | string | `"2026-01"` | Monday.com API version string |
| Include Pagination | `includePagination` | boolean | `false` | Auto-paginate across all pages |
| Pagination Type | `paginationType` | options | `"cursor"` | `"cursor"` or `"page"` — visible when `includePagination: true` |

---

### Pagination

When `includePagination: true`, the node automatically detects the pagination pattern in your query and fetches all pages.

**Page-based query (boards, users, etc.):**
```json
{
  "parameters": {
    "resource": "query",
    "operation": "query",
    "runQuery": "{ boards(limit: 100, page: 1) { id name } }",
    "includePagination": true,
    "paginationType": "page"
  }
}
```

**Cursor-based query (items_page):**
```json
{
  "parameters": {
    "resource": "query",
    "operation": "query",
    "runQuery": "{ boards(ids: [8886337654]) { items_page(limit: 100) { cursor items { id name } } } }",
    "includePagination": true,
    "paginationType": "cursor"
  }
}
```

> Always include a `limit` parameter in your query — pagination will not work without it. The Monday.com API has different max limits per object type (boards: 100, items: 500, users: 100). Check the [Monday.com API docs](https://developer.monday.com/api-reference) for the current limits.

---

### Common query examples

**Get specific columns from an item:**
```graphql
{
  items(ids: ["8886337853"]) {
    id
    name
    column_values(ids: ["status", "date4", "person"]) {
      id
      text
      value
    }
  }
}
```

**Get file column asset URLs:**
```graphql
{
  items(ids: [8020743997]) {
    column_values(ids: "files_mkkqsvnw") {
      value
    }
  }
}
```

**Create an item via mutation:**
```graphql
mutation {
  create_item(
    board_id: 8886337654,
    group_id: "topics",
    item_name: "Created via raw query"
  ) {
    id
    name
  }
}
```

**Update a column value via mutation:**
```graphql
mutation {
  change_simple_column_value(
    board_id: 8886337654,
    item_id: 8886337853,
    column_id: "status",
    value: "Done"
  ) {
    id
  }
}
```

---

## Download File Resource

**Resource value:** `"downloadFile"`

Download a file asset from Monday.com by its asset ID. The output is a binary file that can be passed to other nodes (e.g. save to Google Drive, send via email).

### Operation: Download File

**Operation value:** `"downloadFile"`

```json
{
  "parameters": {
    "resource": "downloadFile",
    "operation": "downloadFile",
    "fileId": "123456789"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Asset ID | `fileId` | string | Required — the Monday.com asset ID |

### How to get an Asset ID

Asset IDs appear in the `value` of a `file`-type column. Use the **Query** resource to fetch it:

```graphql
{
  items(ids: ["8886337853"]) {
    column_values(ids: ["files_mkkqsvnw"]) {
      value
    }
  }
}
```

The `value` JSON will contain something like:
```json
{
  "files": [
    { "assetId": 123456789, "name": "report.pdf", "url": "https://..." }
  ]
}
```

Pass `assetId` into the `fileId` field of this operation.
