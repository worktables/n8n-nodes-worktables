# Column Values Reference

This file covers how to set column values when using **Create an Item**, **Update Column Values**, and **Create or Update Item** operations.

Column values are configured inside the `columnValues.column` array. Each entry sets one column.

---

## Column entry structure

```json
{
  "columnId": "<column-id>",
  "columnType": "<type>",
  ... type-specific fields ...
}
```

- `columnId` — the internal column ID (e.g. `"status"`, `"date4"`, `"text_mkq0ckhb"`). Find IDs via **Get a Board** or **List Board's Groups**.
- `columnType` — controls which input fields appear and how the value is sent to the API.

---

## Column Types

| Type Value | Description |
|---|---|
| `simple` | Plain string — works for text, numbers, status labels |
| `objectValue` | Raw JSON object for full control |
| `date` | Date/datetime picker |
| `checkbox` | Boolean checkbox |
| `people` | Assign users and/or teams |
| `link` | URL + display text |
| `email` | Email address + display text |
| `phone` | Phone number + country code |
| `location` | Latitude, longitude, and address |
| `timeline` | Start and end date range |
| `board_relation` | Connect Boards — link item IDs from another board |
| `dependency` | Dependency column — link item IDs as dependencies |
| `fileLink` | Add file links by URL |
| `button` | Trigger a button click |
| `hour` | Hour column — time as hour and minute |
| `dropdown` | Dropdown column — one or more labels |

---

## simple

Sends a plain string value. Monday.com interprets it based on the column type:
- **Text columns**: stored as-is
- **Number columns**: numeric string
- **Status columns**: the label text (e.g. `"Done"`, `"In Progress"`)

```json
{
  "columnId": "status",
  "columnType": "simple",
  "columnValue": "Done"
}
```

```json
{
  "columnId": "numbers",
  "columnType": "simple",
  "columnValue": "42"
}
```

| Field | Key | Type |
|---|---|---|
| Value | `columnValue` | string |

---

## objectValue

Full JSON object sent directly to the Monday.com API. Use when you need fine-grained control or for column types not covered by specific options.

```json
{
  "columnId": "status",
  "columnType": "objectValue",
  "objectValue": { "label": "Done" }
}
```

```json
{
  "columnId": "dropdown",
  "columnType": "objectValue",
  "objectValue": { "ids": [1, 2] }
}
```

| Field | Key | Type |
|---|---|---|
| Column Value | `objectValue` | JSON |

> Accepts either a JSON literal or an n8n expression: `"={{ $json.columnPayload }}"`

---

## date

```json
{
  "columnId": "date4",
  "columnType": "date",
  "dateValue": "2025-06-01T00:00:00"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Date | `dateValue` | dateTime | ISO 8601 format |

---

## checkbox

```json
{
  "columnId": "checkbox",
  "columnType": "checkbox",
  "checkboxValue": true
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Checked | `checkboxValue` | boolean | `true` = checked, `false` = unchecked |

---

## people

Assign users and/or teams to a People column. Both arrays can be used together.

```json
{
  "columnId": "person",
  "columnType": "people",
  "peopleValue": ["45779868", "35597267"],
  "teamsValue": ["952718"]
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| People | `peopleValue` | multiOptions | User IDs to assign |
| Teams | `teamsValue` | multiOptions | Team IDs to assign |

---

## link

```json
{
  "columnId": "link",
  "columnType": "link",
  "url": "https://example.com",
  "linkText": "Visit Site"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| URL | `url` | string | The destination URL |
| Text | `linkText` | string | Display label for the link |

---

## email

```json
{
  "columnId": "email",
  "columnType": "email",
  "emailValue": "user@example.com",
  "emailText": "Contact Us"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Email | `emailValue` | string | Email address |
| Text | `emailText` | string | Optional display label; defaults to the address |

---

## phone

```json
{
  "columnId": "phone",
  "columnType": "phone",
  "countryCode": "+1 US",
  "phoneValue": "5551234567"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Country Code | `countryCode` | options | Dial code + ISO code (e.g. `"+1 US"`, `"+55 BR"`, `"+44 GB"`) |
| Phone | `phoneValue` | string | Number only — **no country code prefix** |

---

## location

```json
{
  "columnId": "location",
  "columnType": "location",
  "latitude": "-23.5505",
  "longitude": "-46.6333",
  "address": "São Paulo, Brazil"
}
```

| Field | Key | Type |
|---|---|---|
| Latitude | `latitude` | string |
| Longitude | `longitude` | string |
| Address | `address` | string |

---

## timeline

Sets a date range (start → end) for a Timeline column.

```json
{
  "columnId": "timeline",
  "columnType": "timeline",
  "startDate": "2025-06-01T00:00:00",
  "endDate": "2025-06-30T00:00:00"
}
```

| Field | Key | Type |
|---|---|---|
| Start Date | `startDate` | dateTime |
| End Date | `endDate` | dateTime |

---

## board_relation (Connect Boards)

Links items from another board to this column.

```json
{
  "columnId": "connect_boards",
  "columnType": "board_relation",
  "columnValue": "1234567890, 9876543210",
  "addConnections": false
}
```

| Field | Key | Type | Default | Notes |
|---|---|---|---|---|
| Connect Boards | `columnValue` | string | — | Comma-separated item IDs from the connected board |
| Add instead of replacing | `addConnections` | boolean | `false` | `false` = replace all; `true` = append to existing |

---

## fileLink

Adds a file reference by URL (does not upload — the file must be publicly accessible).

```json
{
  "columnId": "files_mkkqsvnw",
  "columnType": "fileLink",
  "fileLinks": {
    "file": [
      {
        "linkToFile": "https://example.com/report.pdf",
        "name": "report.pdf"
      },
      {
        "linkToFile": "https://example.com/data.csv",
        "name": "data.csv"
      }
    ]
  }
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Files | `fileLinks` | fixedCollection | Array of file objects |
| Link | `linkToFile` | string | Direct URL to the file |
| Name | `name` | string | Display name for the file |

> To **upload** binary files (not links), use the **Upload Files to Column** operation instead.

---

## button

Triggers a button click on a Button column.

```json
{
  "columnId": "button",
  "columnType": "button",
  "buttonValue": true
}
```

| Field | Key | Type |
|---|---|---|
| Click | `buttonValue` | boolean |

---

## dependency

Links items from the same or another board as dependencies. Works the same way as `board_relation`.

```json
{
  "columnId": "dependency",
  "columnType": "dependency",
  "columnValue": "1234567890, 9876543210"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Item IDs | `columnValue` | string | Comma-separated item IDs to set as dependencies |

---

## hour

Sets an hour/minute value on an Hour column.

```json
{
  "columnId": "hour_column",
  "columnType": "hour",
  "columnValue": "14:30"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Time | `columnValue` | string | `"HH"` (hour only) or `"HH:MM"` (hour and minute) |

---

## dropdown

Sets one or more labels on a Dropdown column.

```json
{
  "columnId": "dropdown_column",
  "columnType": "dropdown",
  "columnValue": "Option A, Option B"
}
```

| Field | Key | Type | Notes |
|---|---|---|---|
| Labels | `columnValue` | string | Comma-separated label text values |

> Label text must match existing dropdown options exactly. Labels that don't match existing options are silently ignored.

---

## Complete columnValues example

Multiple columns set in one operation:

```json
{
  "columnValues": {
    "column": [
      {
        "columnId": "status",
        "columnType": "simple",
        "columnValue": "Done"
      },
      {
        "columnId": "date4",
        "columnType": "date",
        "dateValue": "2025-06-15T00:00:00"
      },
      {
        "columnId": "person",
        "columnType": "people",
        "peopleValue": ["45779868"],
        "teamsValue": []
      },
      {
        "columnId": "link_mkq",
        "columnType": "link",
        "url": "https://example.com",
        "linkText": "Reference"
      },
      {
        "columnId": "timeline",
        "columnType": "timeline",
        "startDate": "2025-06-01T00:00:00",
        "endDate": "2025-06-30T00:00:00"
      }
    ]
  }
}
```

---

## Finding column IDs

Column IDs are **not** the display titles. To find them:

1. Use **Get a Board** (`resource: board, operation: getBoard`) — the response includes a `columns` array with `id` and `title`.
2. Use **List Board's Groups** — same `columns` data in the output.
3. Use the **Query** resource: `{ boards(ids: [YOUR_BOARD_ID]) { columns { id title type } } }`

Common default column IDs:

| Title | ID |
|---|---|
| Name | `name` |
| Status | `status` |
| Person | `person` |
| Date | `date4` |
| Timeline | `timeline` |
| Files | varies (`files_*`) |
| Numbers | `numbers` |
| Text | varies (`text_*`) |

> Custom columns always have a generated suffix like `text_mkq0ckhb`. These IDs are stable and won't change when you rename the column.

---

## Read-only columns (cannot be set)

These column types are excluded from the column picker and cannot be written:

| Type | Notes |
|---|---|
| `formula` | Computed — read only |
| `auto_number` | Auto-incremented |
| `creation_log` | Set by Monday on creation |
| `last_updated` | Updated by Monday automatically |
| `mirror` | Reflects another board |
| `subtasks` | Managed by subitems system |
| `item_id` | The item's own ID |
| `progress` | Computed from subitems |
