# Update Resource

**Resource value:** `"update"`

Updates are the comment/post thread on a Monday.com item. This resource lets you list, create, edit, delete, pin, and attach files to updates.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| List Updates in an Item | `listUpdates` | Fetch all updates for an item (default) |
| Create | `createUpdate` | Post a new update |
| Update | `updateUpdate` | Edit an existing update |
| Delete | `deleteUpdate` | Remove an update |
| Pin | `pinUpdate` | Pin an update to the top |
| Duplicate | `duplicateUpdate` | Not implemented — throws an error if selected |
| Upload files to update | `uploadFile` | Attach binary files to an update |

---

## List Updates in an Item

```json
{
  "parameters": {
    "resource": "update",
    "operation": "listUpdates",
    "itemId": "8898396217",
    "limit": 50,
    "fromDate": "",
    "toDate": ""
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Item ID | `itemId` | string | — | Required |
| Limit | `limit` | number | `50` | Max updates to return; `0` = all |
| From Date | `fromDate` | dateTime | — | Filter: created on or after this date |
| To Date | `toDate` | dateTime | — | Filter: created on or before this date |

---

## Create an Update

Post a new update to an item's thread. Supports HTML content, replies, pinning, and binary attachments.

```json
{
  "parameters": {
    "resource": "update",
    "operation": "createUpdate",
    "itemId": "8886337853",
    "bodyContent": "<p>Posted via n8n</p>",
    "isReply": false,
    "pinToTop": false,
    "attachmentsUpdate": ""
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Item ID | `itemId` | string | — | Required — item to post on |
| Body Content | `bodyContent` | string | — | HTML content of the update |
| Is Reply | `isReply` | boolean | `false` | Post as a reply to another update |
| Update ID To Reply | `updateId` | string | — | Required when `isReply: true` |
| Pin Update to Top | `pinToTop` | boolean | `false` | Pin this update immediately (not available for replies) |
| Attachments | `attachmentsUpdate` | string | — | Comma-separated binary property names |

**Reply to an existing update:**
```json
{
  "parameters": {
    "resource": "update",
    "operation": "createUpdate",
    "itemId": "8886337853",
    "bodyContent": "<p>This is a reply</p>",
    "isReply": true,
    "updateId": "4024728517"
  }
}
```

**With a file attachment:**
```json
{
  "parameters": {
    "resource": "update",
    "operation": "createUpdate",
    "itemId": "8886337853",
    "bodyContent": "<p>See attached file</p>",
    "isReply": false,
    "attachmentsUpdate": "data"
  }
}
```

> `bodyContent` supports standard HTML tags: `<p>`, `<b>`, `<i>`, `<ul>`, `<li>`, etc.

---

## Update an Update

Edit the body of an existing update.

```json
{
  "parameters": {
    "resource": "update",
    "operation": "updateUpdate",
    "updateId": "4024728517",
    "bodyContent": "<p>Edited via n8n</p>",
    "attachmentsUpdate": ""
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Update ID | `updateId` | string | Required |
| Body Content | `bodyContent` | string | New HTML content to replace the existing body |
| Attachments | `attachmentsUpdate` | string | Comma-separated binary property names |

---

## Delete an Update

```json
{
  "parameters": {
    "resource": "update",
    "operation": "deleteUpdate",
    "updateId": "4024728517"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Update ID | `updateId` | string | Required |

---

## Pin an Update

Pins an update to the top of the item's update thread.

```json
{
  "parameters": {
    "resource": "update",
    "operation": "pinUpdate",
    "itemId": "8886337853",
    "updateId": "4024728517"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Item ID | `itemId` | string | Required — the item that owns the update |
| Update ID | `updateId` | string | Required — the update to pin |

---

## Upload Files to an Update

Attaches binary files from previous nodes to an existing update.

```json
{
  "parameters": {
    "resource": "update",
    "operation": "uploadFile",
    "updateId": "4024728517",
    "attachmentsUpdate": "data"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Update ID | `updateId` | string | Required |
| Attachments | `attachmentsUpdate` | string | Comma-separated binary property names from the input |

> A previous node must produce binary output (e.g. HTTP Request, Read Binary File, Google Drive download).  
> Multiple files: `"attachmentsUpdate": "file1, file2, file3"`

---

## Tips

- Update IDs are returned in the output of `listUpdates` and `createUpdate` — pipe them using expressions like `"={{ $json.id }}"`.
- HTML content is supported in `bodyContent` — wrap text in `<p>` tags for proper formatting in Monday.
- `pinToTop` is only available when `isReply: false`. Replies cannot be pinned.
