# Board Resource

**Resource value:** `"board"`

All board-level operations: listing, creating, duplicating, managing groups, subscribers and activity logs.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| List Boards | `listBoards` | List all boards (default) |
| List Board's Groups | `listBoardGroups` | List all groups in a board |
| Get a Board | `getBoard` | Retrieve full board details |
| Get a Group | `getGroup` | Retrieve a specific group |
| Create a Board | `createBoard` | Create a new board |
| Create a Group | `createGroup` | Add a group to a board |
| Duplicate a Board | `duplicateBoard` | Copy an existing board |
| Duplicate a Group | `duplicateGroup` | Copy a group within a board |
| List Activity Logs | `listBoardActivityLogs` | Board-level activity feed |
| List Board Subscribers | `listBoardSubscribers` | All subscribers of a board |
| Add Board Subscribers | `addBoardSubscribers` | Subscribe users/teams to a board |
| Remove Board Subscribers | `removeBoardSubscribers` | Unsubscribe users from a board |

---

## List Boards

```json
{
  "parameters": {
    "resource": "board",
    "operation": "listBoards",
    "boardKind": "all",
    "state": "active",
    "orderBy": "none",
    "limit": 50,
    "requestTimeout": 30000,
    "filterByWorkspace": false
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board Kind | `boardKind` | options | `"all"` | `"all"` `"public"` `"private"` `"share"` |
| Order By | `orderBy` | options | `"none"` | `"none"` `"created_at"` `"used_at"` |
| State | `state` | options | `"active"` | `"all"` `"active"` `"archived"` `"deleted"` |
| Limit | `limit` | number | `50` | `0` = all boards |
| Request Timeout (ms) | `requestTimeout` | number | `30000` | Increase for large accounts |
| Filter by Workspace | `filterByWorkspace` | boolean | `false` | Enables workspace filter |
| Workspace | `workspace` | options/string | — | Required when `filterByWorkspace: true` |

**With workspace filter:**
```json
{
  "parameters": {
    "resource": "board",
    "operation": "listBoards",
    "boardKind": "public",
    "state": "active",
    "limit": 0,
    "filterByWorkspace": true,
    "workspace": "2425174"
  }
}
```

---

## List Board's Groups

```json
{
  "parameters": {
    "resource": "board",
    "operation": "listBoardGroups",
    "workspace": "-1",
    "boardId": "6414507323",
    "archiveGroup": false,
    "deleteGroup": false
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Workspace | `workspace` | options/string | — | Required |
| Board | `boardId` | options/string | — | Required |
| Archived | `archiveGroup` | boolean | `false` | Include archived groups in result |
| Deleted | `deleteGroup` | boolean | `false` | Include deleted groups in result |

---

## Get a Board

Returns board details including columns, groups, subscribers and workspace.

```json
{
  "parameters": {
    "resource": "board",
    "operation": "getBoard",
    "boardId": "8886337654"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |

---

## Get a Group

```json
{
  "parameters": {
    "resource": "board",
    "operation": "getGroup",
    "boardId": "8886337654",
    "groupId": "topics"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Group ID | `groupId` | options/string | Required |

---

## Create a Board

```json
{
  "parameters": {
    "resource": "board",
    "operation": "createBoard",
    "workspace": "2425174",
    "boardName": "My New Board",
    "boardKind": "public",
    "description": "Created via n8n",
    "templateId": "",
    "folder": "16952074",
    "usersBoardIds": {
      "usersBoardIds": [
        { "userId": "61864800", "isOwner": true }
      ]
    },
    "teamBoardIds": {
      "teamBoardIds": [
        { "teamId": "952718", "isOwner": false }
      ]
    }
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Workspace | `workspace` | options/string | — | Required |
| New Board Name | `boardName` | string | — | Board display name |
| Board Kind | `boardKind` | options | `"public"` | `"public"` `"private"` `"share"` |
| Description | `description` | string | — | Optional description |
| Template ID | `templateId` | string | — | Monday.com template ID |
| Folder ID | `folder` | options/string | — | Required; use `"-1"` for no folder |
| User Subscribers | `usersBoardIds` | fixedCollection | — | List of `{ userId, isOwner }` |
| Team Subscribers | `teamBoardIds` | fixedCollection | — | List of `{ teamId, isOwner }` |

---

## Create a Group

```json
{
  "parameters": {
    "resource": "board",
    "operation": "createGroup",
    "boardId": "8886337654",
    "groupName": "New Group",
    "groupColor": "#00c875",
    "groupId": "topics",
    "positionRelative": "after_at"
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Group Name | `groupName` | string | — | Display name |
| Group Color | `groupColor` | options | `"#c4c4c4"` | See color options below |
| Relative To Group | `groupId` | options/string | — | Anchor group for positioning |
| Position Relative | `positionRelative` | options | `"before_at"` | `"before_at"` or `"after_at"` |

**Available colors:**

| Name | Hex |
|---|---|
| Grey | `#c4c4c4` |
| Working Orange | `#fdab3d` |
| Done Green | `#00c875` |
| Stuck Red | `#e2445c` |
| Dark Blue | `#0086c0` |
| Purple | `#a25ddc` |
| Grass Green | `#037f4c` |
| Bright Blue | `#579bfc` |
| Saladish | `#cab641` |
| Egg Yolk | `#ffcb00` |
| Dark Red | `#bb3354` |
| Sofia Pink | `#ff158a` |
| Lipstick | `#ff5ac4` |
| Dark Purple | `#784bd1` |
| Bright Green | `#9cd326` |
| Chili Blue | `#66ccff` |
| American Grey | `#808080` |
| Brown | `#7f5347` |
| Dark Orange | `#ff642e` |

---

## Duplicate a Board

```json
{
  "parameters": {
    "resource": "board",
    "operation": "duplicateBoard",
    "boardId": "8886337654",
    "workspace": "2425174",
    "folder": "16952074",
    "boardName": "Duplicated by n8n",
    "keepSubscribers": true,
    "duplicateType": "duplicate_board_with_structure"
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board to Duplicate | `boardId` | options/string | — | Source board |
| Destination Workspace | `workspace` | options/string | — | Required |
| Destination Folder | `folder` | options/string | — | Required; use `"-1"` for none |
| New Board Name | `boardName` | string | — | Name for the copy |
| Keep Subscribers | `keepSubscribers` | boolean | `false` | Copy subscriber list |
| Duplicate Type | `duplicateType` | options | `"duplicate_board_with_structure"` | See below |

**Duplicate type options:**

| Value | Description |
|---|---|
| `duplicate_board_with_structure` | Copy structure only (no items) |
| `duplicate_board_with_pulses` | Copy structure + items |
| `duplicate_board_with_pulses_and_updates` | Copy structure + items + updates |

---

## Duplicate a Group

```json
{
  "parameters": {
    "resource": "board",
    "operation": "duplicateGroup",
    "boardId": "8886337654",
    "groupId": "topics",
    "groupName": "Duplicated Group",
    "addToTop": false
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| Group | `groupId` | options/string | — | Group to duplicate |
| Group Name | `groupName` | string | — | Name for the copy |
| Add to Top | `addToTop` | boolean | `false` | Place copy at the top of the board |

---

## List Activity Logs

```json
{
  "parameters": {
    "resource": "board",
    "operation": "listBoardActivityLogs",
    "boardId": "8886337654",
    "from": "2025-04-08T00:00:00",
    "to": "2025-04-09T14:44:51",
    "limit": 50,
    "itemIds": "8886337853, 8886337925",
    "columnIdsFilter": "status, date4",
    "groupIdsFilter": "topics",
    "userIdsFilter": ["45779868"]
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Board | `boardId` | options/string | — | Required |
| From | `from` | dateTime | — | Inclusive start datetime |
| To | `to` | dateTime | — | Inclusive end datetime |
| Limit | `limit` | number | `50` | `0` = all logs |
| Item IDs | `itemIds` | string | — | Comma-separated item IDs |
| Column IDs | `columnIdsFilter` | string | — | Comma-separated column IDs |
| Group IDs | `groupIdsFilter` | string | — | Comma-separated group IDs |
| User IDs | `userIdsFilter` | multiOptions | `[]` | Selected users |

---

## List Board Subscribers

```json
{
  "parameters": {
    "resource": "board",
    "operation": "listBoardSubscribers",
    "boardId": "8886337654"
  }
}
```

Returns both user subscribers and team subscribers with full profile details.

---

## Add Board Subscribers

```json
{
  "parameters": {
    "resource": "board",
    "operation": "addBoardSubscribers",
    "boardId": "8886337654",
    "usersBoardIds": {
      "usersBoardIds": [
        { "userId": "35597267", "isOwner": false },
        { "userId": "61864800", "isOwner": true }
      ]
    },
    "teamBoardIds": {
      "teamBoardIds": [
        { "teamId": "952709", "isOwner": false }
      ]
    }
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| User Subscribers | `usersBoardIds` | fixedCollection | `{ userId, isOwner }` entries |
| Team Subscribers | `teamBoardIds` | fixedCollection | `{ teamId, isOwner }` entries |

---

## Remove Board Subscribers

```json
{
  "parameters": {
    "resource": "board",
    "operation": "removeBoardSubscribers",
    "boardId": "8886337654",
    "removeSubscribers": ["71503960", "35597267"]
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Board | `boardId` | options/string | Required |
| Remove Subscribers | `removeSubscribers` | multiOptions | Array of user IDs |
