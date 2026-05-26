# @worktables/n8n-nodes-worktables

An n8n community node package for **Monday.com**. Provides a full-featured action node and a webhook trigger node, both built on the Monday.com GraphQL API.

## Nodes

| Node | Type | Description |
|---|---|---|
| `Worktables` | Action | Read and write data in Monday.com — boards, items, subitems, updates, teams, users, notifications, and raw GraphQL queries |
| `Worktables Webhook` | Trigger | Receive Monday.com webhook events; optionally fetch the related item automatically |

## Installation

Follow n8n's [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

In your n8n instance go to **Settings → Community Nodes → Install** and enter:

```
@worktables/n8n-nodes-worktables
```

## Credentials

Both nodes use the **monday.com API** credential type. You need a Monday.com API token.

1. In Monday.com go to your avatar → **Developers → My Access Tokens**.
2. Copy your personal API token.
3. In n8n add a new credential of type **monday.com API** and paste the token.

The Webhook node can work without credentials for raw event pass-through. Credentials are required only when **Get Item After Event** is enabled.

## Operations

### Board

| Operation | Description |
|---|---|
| List Boards | List all boards |
| List Board's Groups | List all groups in a board |
| Get a Board | Retrieve full board details |
| Get a Group | Retrieve a specific group |
| Create a Board | Create a new board |
| Create a Group | Add a group to a board |
| Duplicate a Board | Copy an existing board |
| Duplicate a Group | Copy a group within a board |
| List Activity Logs | Board-level activity feed |
| List Board Subscribers | All subscribers of a board |
| Add Board Subscribers | Subscribe users/teams to a board |
| Remove Board Subscribers | Unsubscribe users from a board |

### Item / Subitem

| Operation | Description |
|---|---|
| Get an Item | Fetch a single item by ID |
| Create an Item | Create a new item |
| Update Column Values | Update columns on an existing item |
| Create or Update Item | Upsert by identifier column value |
| Delete an Item | Permanently delete an item |
| Duplicate an Item | Copy an item |
| List Items in a Board | Paginated item list for a board |
| List Items in a Group | Paginated item list for a group |
| Search Items by Filter | Filter and sort items |
| List Item Subscribers | Users subscribed to an item |
| Get Item Activity Logs | Activity feed for a single item |
| Upload Files to Column | Upload binary file to a file column |

Most item operations support subitems by toggling `isSubitem: true`.

### Update

| Operation | Description |
|---|---|
| Create an Update | Post a text update on an item |
| Edit an Update | Edit an existing update |
| Pin an Update | Pin an update to an item |
| Delete an Update | Remove an update |
| Like an Update | Like an update |
| Upload File to Update | Attach a file to an update post |

### Other Resources

| Resource | Operations |
|---|---|
| Team | List Teams, Get a Team |
| User | List Users, Get a User, Get Me |
| Notification | Send a Notification |
| Query | Run raw GraphQL query or mutation; Download a file |

## Usage

### Column values

When creating or updating items, column values are passed as a `columnValues` array. Each entry specifies the column ID and a typed value. Supported column types include: `text`, `number`, `status`, `date`, `people`, `email`, `phone`, `link`, `checkbox`, `dropdown`, `rating`, `timeline`, `location`, `country`, and more.

See [`docs/column-values.md`](./docs/column-values.md) for the full reference with JSON examples for every column type.

### Upserting items

Use **Create or Update Item** with an `identifierColumn` (any non-read-only column) and an `identifierValue`. If a matching item exists it is updated; otherwise a new item is created.

### Setting a limit of 0

Wherever a `limit` field exists, setting it to `0` enables automatic pagination and returns every record. Use with care on large boards.

### Raw GraphQL

When no built-in operation fits, use **Resource: Query → Run API** to send any Monday.com GraphQL query or mutation directly. Enable `includePagination` to auto-page cursor or page-based queries.

### Webhooks

The **Worktables Webhook** node registers a Monday.com webhook and receives events in real time. Monday.com's challenge handshake is handled automatically. Enable **Get Item After Event** to have the node fetch the full item after each event fires.

## Documentation

Full parameter references and JSON examples for every operation are in the [`docs/`](./docs/) folder:

- [`docs/board.md`](./docs/board.md)
- [`docs/item.md`](./docs/item.md)
- [`docs/update.md`](./docs/update.md)
- [`docs/team.md`](./docs/team.md)
- [`docs/user.md`](./docs/user.md)
- [`docs/notification.md`](./docs/notification.md)
- [`docs/query.md`](./docs/query.md)
- [`docs/webhook.md`](./docs/webhook.md)
- [`docs/column-values.md`](./docs/column-values.md)

## Compatibility

Tested against n8n `1.x`. Requires Node.js 18 or later.

The nodes use Monday.com API version `2026-01` by default. You can override this only in the **Query** resource via the `apiVersion` parameter.

## Resources

- [Monday.com API documentation](https://developer.monday.com/api-reference/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](./LICENSE.md)
