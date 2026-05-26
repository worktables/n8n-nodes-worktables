# Notification Resource

**Resource value:** `"notification"`

Send in-app notifications to Monday.com users.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| Send Notification | `sendNotification` | Send a notification to a user (default) |

---

## Send Notification

```json
{
  "parameters": {
    "resource": "notification",
    "operation": "sendNotification",
    "notificationUserId": "45779868",
    "notificationTargetId": "8886337853",
    "notificationTargetType": "Project",
    "notificationMessage": "You have a new task assigned to you"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| User ID | `notificationUserId` | string | Required — recipient's Monday.com user ID |
| Target ID | `notificationTargetId` | string | Required — the item or post ID the notification links to |
| Target Type | `notificationTargetType` | options | Required — `"Project"` (item) or `"Post"` (update) |
| Message | `notificationMessage` | string | Required — notification text (plain text) |

### Target Type values

| Label | Value | Use when |
|---|---|---|
| Project | `"Project"` | Linking to a board item |
| Post | `"Post"` | Linking to a specific update |

---

## Dynamic example

Send a notification using data from a previous node:

```json
{
  "parameters": {
    "resource": "notification",
    "operation": "sendNotification",
    "notificationUserId": "={{ $json.assigneeId }}",
    "notificationTargetId": "={{ $json.itemId }}",
    "notificationTargetType": "Project",
    "notificationMessage": "={{ 'Item updated: ' + $json.itemName }}"
  }
}
```

---

## Notes

- Notifications appear in the Monday.com bell icon for the recipient.
- `notificationMessage` is plain text — HTML is not supported.
- To notify multiple users, use an n8n **Loop** or **SplitInBatches** node upstream.
