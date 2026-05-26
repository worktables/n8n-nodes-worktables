# Worktables Webhook Node

**Node type:** `@worktables/n8n-nodes-worktables.mondayWebhook`  
**Kind:** Trigger node  
**Credential:** `WorktablesApi` (optional — needed only when **Get Item After Event** is enabled)

Listens for Monday.com webhook events and triggers the workflow when an event arrives. Can optionally fetch the full item from the API after receiving the event.

---

## How Monday.com Webhooks Work

1. You register a webhook URL in Monday.com pointing to the n8n webhook path
2. Monday.com sends a POST request to that URL when the subscribed event fires
3. This node receives the payload and passes it to the workflow

Monday.com also sends a **challenge request** when a webhook is first registered. The node handles this automatically — it responds to the challenge and does not trigger the workflow.

---

## Parameters

| Parameter | Key | Type | Default | Description |
|---|---|---|---|---|
| Get Item After Event | `getItemAfterEvent` | boolean | `false` | Fetch the full item from Monday after receiving the event |
| Is Subitem | `isSubitem` | boolean | `false` | Treat the item as a subitem when fetching |
| Fetch Subitems | `fetchSubitems` | boolean | `false` | Include child subitems in the response (when not a subitem) |
| Fetch Parent Item | `fetchParentItem` | boolean | `false` | Include the parent item in the response (when a subitem) |
| Fetch All Columns | `fetchAllColumns` | boolean | `true` | Fetch all columns vs a specific subset |
| Column IDs | `columnIds` | string | — | Comma-separated column IDs (when `fetchAllColumns: false`) |

---

## Configurations

### Minimal — raw event pass-through

The node passes the raw Monday.com webhook payload directly to the workflow. No API call is made.

```json
{
  "parameters": {},
  "type": "@worktables/n8n-nodes-worktables.mondayWebhook",
  "typeVersion": 1,
  "webhookId": "a778ebae-95c3-4f05-ad86-0ada346025a1"
}
```

---

### With item fetch (all columns)

After receiving the event the node calls the Monday.com API to retrieve the full item and merges it into the output.

```json
{
  "parameters": {
    "getItemAfterEvent": true,
    "isSubitem": false,
    "fetchSubitems": false,
    "fetchAllColumns": true
  },
  "type": "@worktables/n8n-nodes-worktables.mondayWebhook",
  "typeVersion": 1,
  "webhookId": "a778ebae-95c3-4f05-ad86-0ada346025a1",
  "credentials": {
    "WorktablesApi": {
      "id": "<credential-id>",
      "name": "<credential-name>"
    }
  }
}
```

---

### With item fetch (specific columns)

```json
{
  "parameters": {
    "getItemAfterEvent": true,
    "isSubitem": false,
    "fetchSubitems": false,
    "fetchAllColumns": false,
    "columnIds": "status, date4, person"
  },
  "type": "@worktables/n8n-nodes-worktables.mondayWebhook",
  "typeVersion": 1,
  "webhookId": "a778ebae-95c3-4f05-ad86-0ada346025a1",
  "credentials": {
    "WorktablesApi": { "id": "...", "name": "..." }
  }
}
```

---

### Subitem event with parent item

```json
{
  "parameters": {
    "getItemAfterEvent": true,
    "isSubitem": true,
    "fetchParentItem": true,
    "fetchAllColumns": true
  },
  "type": "@worktables/n8n-nodes-worktables.mondayWebhook",
  "typeVersion": 1,
  "webhookId": "a778ebae-95c3-4f05-ad86-0ada346025a1",
  "credentials": {
    "WorktablesApi": { "id": "...", "name": "..." }
  }
}
```

---

## Output

### Raw mode (`getItemAfterEvent: false`)

The output is the raw Monday.com webhook payload. Structure varies by event type. Example for a column change:

```json
{
  "event": {
    "type": "update_column_value",
    "userId": 45779868,
    "originalTriggerUuid": null,
    "boardId": 8886337654,
    "groupId": "topics",
    "pulseId": 8886337853,
    "pulseName": "Item Name",
    "columnId": "status",
    "columnType": "color",
    "columnTitle": "Status",
    "value": { "label": { "index": 1, "text": "Done" } },
    "previousValue": { "label": { "index": 0, "text": "Working on it" } },
    "changedAt": 1700000000.0
  }
}
```

### With item fetch (`getItemAfterEvent: true`)

The raw event payload is merged with a formatted `item` object:

```json
{
  "event": { ... },
  "item": {
    "id": "8886337853",
    "name": "Item Name",
    "url": "https://monday.com/boards/...",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z",
    "board": { "id": "8886337654" },
    "group": {
      "id": "topics",
      "title": "Topics",
      "color": "#579bfc",
      "position": "0"
    },
    "column_values": {
      "status": { "type": "color",  "value": { "index": 1 }, "text": "Done" },
      "date4":  { "type": "date",   "value": { "date": "2025-06-01" }, "text": "2025-06-01" },
      "person": { "type": "people", "value": { "personsAndTeams": [...] }, "text": "Alice" }
    },
    "subitems": []
  }
}
```

If the item cannot be found (deleted or inaccessible), `item` will be `null` and the raw event body is still returned.

---

## Item ID resolution

The node tries to extract the item ID from the event payload using these fields in order:

1. `body.event.pulseId`
2. `body.event.itemId`
3. `body.event.entityId`
4. `body.pulseId`
5. `body.itemId`

If none are present, the raw payload is returned without fetching.

---

## Tips

- Use **raw mode** when you only need the event data (e.g. to capture the changed value and old value).
- Use **Get Item After Event** when you need a consistent view of the full item state after the change.
- The `item` field in the output has the same column_values format as the **Get an Item** operation — see [item.md](./item.md) for the output shape.
- If you receive many events rapidly, the item fetch adds one API call per event. Consider raw mode + a separate **Get an Item** node downstream if you need to rate-limit.
