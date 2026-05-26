# Item & Subitem Resource

**Resource value:** `"item"` (or `"subitem"` for the legacy createSubitem operation)

Items are the rows of a Monday.com board. Subitems are child rows attached to a parent item. Most item operations support both by toggling `isSubitem`.

See [column-values.md](./column-values.md) for a full reference on how to set every column type.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| Get an Item | `getItem` | Fetch a single item by ID |
| Create an Item | `createItem` | Create a new item (default) |
| Update Column Values | `updateItem` | Update columns on an existing item |
| Create or Update Item | `createOrUpdateItem` | Upsert by identifier column |
| Delete an Item | `deleteItem` | Permanently delete an item |
| Duplicate an Item | `duplicateItem` | Copy an item |
| List Items in a Board | `listBoardItems` | Paginated item list for a board |
| List Items in a Group | `listGroupItems` | Paginated item list for a group |
| Search Items by Filter | `searchItems` | Filter + sort items |
| List Item Subscribers | `listItemSubscribers` | Users subscribed to an item |
| Get Item Activity Logs | `getItemActivityLogs` | Activity feed for a single item |
| Upload Files to Column | `uploadItemFile` | Upload binary file to a file column |

---

## Get an Item

Fetches a single item by its ID with formatted column values.

```json
{
  "parameters": {
    "resource": "item",
    "operation": "getItem",
    "itemId": "8886337853",
    "isSubitem": false,
    "fetchSubitems": false,
    "fetchAllColumns": true
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Item ID | `itemId` | string | — | Required |
| Is Subitem | `isSubitem` | boolean | `false` | Treat as subitem |
| Fetch Subitems | `fetchSubitems` | boolean | `false` | Include child subitems (when not a subitem) |
| Fetch Parent Item | `fetchParentItems` | boolean | `false` | Include parent item data (when a subitem) |
| Fetch All Columns | `fetchAllColumns` | boolean | `true` | All columns vs specific ones |
| Column IDs | `columnIds` | string | — | Comma-separated, used when `fetchAllColumns: false` |

**Fetch specific columns only:**
```json
{
  "parameters": {
    "resource": "item",
    "operation": "getItem",
    "itemId": "8886337853",
    "fetchAllColumns": false,
    "columnIds": "status, date4, person"
  }
}
```

**Get a subitem and its parent:**
```json
{
  "parameters": {
    "resource": "item",
    "operation": "getItem",
    "itemId": "8886340579",
    "isSubitem": true,
    "fetchParentItems": true,
    "fetchAllColumns": true
  }
}
```

### Output shape

```json
{
  "id": "8886337853",
  "name": "Item Name",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-02T00:00:00Z",
  "group": {
    "id": "topics",
    "title": "Topics",
    "color": "#579bfc",
    "position": "0"
  },
  "column_values": {
    "status": { "type": "color", "value": { "index": 1 }, "text": "Done" },
    "date4":  { "type": "date",  "value": { "date": "2025-06-01" }, "text": "2025-06-01" },
    "person": { "type": "people", "value": { "personsAndTeams": [...] }, "text": "Alice" }
  }
}
```

---

## Create an Item

```json
{
  "parameters": {
    "resource": "item",
    "operation": "createItem",
    "boardId": "8886337654",
    "isSubitem": false,
    "groupId": "group_mkpva8wm",
    "itemName": "New Item",
    "columnValues": {
      "column": [
        {
          "columnId": "status",
          "columnType": "simple",
          "columnValue": "Done"
        }
      ]
    }
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Is Subitem? | `isSubitem` | boolean | Toggle to create a subitem instead |
| Group | `groupId` | options/string | Required when `isSubitem: false` |
| Parent Item | `parentId` | options/string | Required when `isSubitem: true` |
| Item Name | `itemName` | string | Display name for the item |
| Column Values | `columnValues` | fixedCollection | See [column-values.md](./column-values.md) |

**Create a subitem:**
```json
{
  "parameters": {
    "resource": "item",
    "operation": "createItem",
    "boardId": "8886337654",
    "isSubitem": true,
    "parentId": "8886337853",
    "itemName": "New Subitem",
    "columnValues": { "column": [] }
  }
}
```

---

## Update Column Values of an Item

Updates one or more column values on an existing item or subitem.

```json
{
  "parameters": {
    "resource": "item",
    "operation": "updateItem",
    "boardId": "8886337654",
    "itemId": "8886337853",
    "columnValues": {
      "column": [
        {
          "columnId": "status",
          "columnType": "simple",
          "columnValue": "In Progress"
        },
        {
          "columnId": "date4",
          "columnType": "date",
          "dateValue": "2025-06-01T00:00:00"
        }
      ]
    }
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Item | `itemId` | options/string | Required — item to update |
| Column Values | `columnValues` | fixedCollection | See [column-values.md](./column-values.md) |

---

## Create or Update Item (Upsert)

Searches for an existing item using an identifier column and either updates it or creates a new one.

```json
{
  "parameters": {
    "resource": "item",
    "operation": "createOrUpdateItem",
    "boardId": "8886337654",
    "isSubitem": false,
    "identifierColumn": "text_mkq0ckhb",
    "itemIdOptional": "my-unique-key",
    "itemName": "Upserted Item",
    "groupName": "topics",
    "columnValues": {
      "column": [
        {
          "columnId": "status",
          "columnType": "simple",
          "columnValue": "Done"
        }
      ]
    }
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Is Subitem? | `isSubitem` | boolean | Work with subitems |
| Identifier Column | `identifierColumn` | options | Column used to look up the item |
| Identifier Value | `itemIdOptional` | string | Value to match; leave empty to always create |
| Item Name | `itemName` | string | Name for create or rename on update |
| Group Name | `groupName` | options/string | Group for new items (when `isSubitem: false`) |
| Parent Item | `parentId` | options/string | Parent for new subitems (when `isSubitem: true`) |
| Column Values | `columnValues` | fixedCollection | Applied on both create and update |

**How it works:**
1. If `itemIdOptional` is empty → always creates a new item
2. If `itemIdOptional` has a value → searches the board for an item where `identifierColumn` matches that value
3. Match found → update that item's column values
4. No match → create a new item

> Read-only column types (formula, auto_number, creation_log, last_updated, mirror, file, button) are excluded from the identifier column list.

---

## Delete an Item

```json
{
  "parameters": {
    "resource": "item",
    "operation": "deleteItem",
    "itemId": "8886337853"
  }
}
```

Works for both items and subitems — just pass the correct item ID.

---

## Duplicate an Item

```json
{
  "parameters": {
    "resource": "item",
    "operation": "duplicateItem",
    "boardId": "8886337654",
    "itemId": "8886337925",
    "withUpdates": true
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Item | `itemId` | options/string | — | Item to copy |
| With Updates | `withUpdates` | boolean | `false` | Include update posts in the copy |

---

## List Items in a Board

```json
{
  "parameters": {
    "resource": "item",
    "operation": "listBoardItems",
    "boardId": "7055564156",
    "limit": 50,
    "fetchAllColumns": true
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Limit | `limit` | number | `50` | `0` = all items |
| Fetch All Columns | `fetchAllColumns` | boolean | `true` | All vs specific columns |
| Column IDs | `columnIds` | string | — | Comma-separated when `fetchAllColumns: false` |

---

## List Items in a Group

```json
{
  "parameters": {
    "resource": "item",
    "operation": "listGroupItems",
    "boardId": "8886337654",
    "groupId": "topics",
    "limit": 50,
    "fetchAllColumns": true
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Group ID | `groupId` | options/string | — | Required |
| Limit | `limit` | number | `50` | `0` = all items |
| Fetch All Columns | `fetchAllColumns` | boolean | `true` | All vs specific columns |
| Column IDs | `columnIds` | string | — | Comma-separated when `fetchAllColumns: false` |

---

## Search Items by Filter

```json
{
  "parameters": {
    "resource": "item",
    "operation": "searchItems",
    "boardId": "8886337654",
    "logicalOperator": "and",
    "fetchColumnValues": true,
    "fetchAllColumns": true,
    "filterRules": {
      "rule": [
        {
          "columnId": "status",
          "compareAttribute": "text",
          "operator": "any_of",
          "compareValue": "Done"
        },
        {
          "columnId": "text_mkq0ckhb",
          "operator": "contains_text",
          "compareValue": "keyword"
        }
      ]
    },
    "sortOptions": {
      "sortBy": [
        { "columnId": "name", "direction": "desc" }
      ]
    }
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Logical Operator | `logicalOperator` | options | `"and"` | `"and"` or `"or"` between rules |
| Fetch Column Values | `fetchColumnValues` | boolean | `false` | Include column data in output |
| Fetch All Columns | `fetchAllColumns` | boolean | `true` | All vs specific (when fetchColumnValues) |
| Column IDs | `columnIds` | string | — | Comma-separated when `fetchAllColumns: false` |
| Filter Rules | `filterRules` | fixedCollection | — | Array of rule objects |
| Sort Options | `sortOptions` | fixedCollection | — | Array of sort objects |

### Filter rule fields

| Field | Key | Notes |
|---|---|---|
| Column | `columnId` | The column to filter on |
| Compare Attribute | `compareAttribute` | Optional — use `"text"` for status labels |
| Operator | `operator` | See operator list below |
| Compare Value | `compareValue` | The value to compare against |

### Operator options

| Label | Value |
|---|---|
| Any Of | `any_of` |
| Not Any Of | `not_any_of` |
| Equals | `equals` |
| Is Empty | `is_empty` |
| Is Not Empty | `is_not_empty` |
| Greater Than | `greater_than` |
| Greater Than or Equal | `greater_than_or_equals` |
| Less Than | `lower_than` |
| Less Than or Equal | `lower_than_or_equal` |
| Between | `between` |
| Contains Text | `contains_text` |
| Does Not Contain Text | `not_contains_text` |
| Contains Terms | `contains_terms` |
| Starts With | `starts_with` |
| Ends With | `ends_with` |
| Within the Next | `within_the_next` |
| Within the Last | `within_the_last` |

### Sort fields

| Field | Key | Notes |
|---|---|---|
| Column | `columnId` | Column to sort by |
| Direction | `direction` | `"asc"` or `"desc"` |

---

## List Item Subscribers

```json
{
  "parameters": {
    "resource": "item",
    "operation": "listItemSubscribers",
    "itemId": "8886337853"
  }
}
```

---

## Get Item Activity Logs

```json
{
  "parameters": {
    "resource": "item",
    "operation": "getItemActivityLogs",
    "itemId": "8886337853",
    "from": "2025-01-01T00:00:00",
    "to": "2025-12-31T23:59:59",
    "limit": 50
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Item ID | `itemId` | string | — | Required |
| From | `from` | dateTime | — | Inclusive start |
| To | `to` | dateTime | — | Inclusive end |
| Limit | `limit` | number | `50` | `0` = all logs |

---

## Upload Files to Column

Uploads one or more binary files to a `file`-type column on an item.

```json
{
  "parameters": {
    "resource": "item",
    "operation": "uploadItemFile",
    "boardId": "8886337654",
    "itemId": "8886337853",
    "fileColumnId": "files_mkkqsvnw",
    "binaryPropertyName": "data"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Item | `itemId` | options/string | Required |
| File Column | `fileColumnId` | options | Only `file`-type columns appear here |
| Binary Property | `binaryPropertyName` | string | n8n binary field name(s), comma-separated for multiple files |

> The previous node in the workflow must output a binary file (e.g. from an HTTP Request, Read Binary File, or Google Drive node).

---

## Notes on Subitems

- Set `isSubitem: true` on **createItem** and **createOrUpdateItem** to work with subitems
- `boardId` always refers to the **parent board**, not the hidden "Subitems of …" board
- The node automatically resolves the correct subitem board for column loading
- If the board has no subitems yet, the column dropdown will be empty — create one manually first to populate it
