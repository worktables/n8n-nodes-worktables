# User Resource

**Resource value:** `"user"`

Read user information from the Monday.com account.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| List Users | `listUsers` | List all users in the account (default) |
| Get a User | `getUser` | Retrieve specific users by ID |

---

## List Users

```json
{
  "parameters": {
    "resource": "user",
    "operation": "listUsers"
  }
}
```

No additional parameters. Returns all users in the account.

---

## Get a User

```json
{
  "parameters": {
    "resource": "user",
    "operation": "getUser",
    "userIds": ["45779868", "35597267"]
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Users | `userIds` | multiOptions | One or more user IDs to retrieve |

---

## Notes

- User IDs are referenced throughout the other resources (People columns, board subscribers, team members, notifications). Use **List Users** to discover IDs.
- `userIds` is a multi-select — you can pass multiple IDs in a single call.
- To use a dynamic user ID from a previous node: `"userIds": ["={{ $json.userId }}"]`
