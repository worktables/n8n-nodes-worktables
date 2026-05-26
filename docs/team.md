# Team Resource

**Resource value:** `"team"`

Manage Monday.com teams: list, get, create, delete, and manage team membership.

---

## Operations

| Operation | Value | Description |
|---|---|---|
| List Teams | `listTeams` | List all teams (default) |
| Get a Team | `getTeam` | Retrieve a specific team's details |
| Create a Team | `createTeam` | Create a new team |
| Delete a Team | `deleteTeam` | Delete a team |
| Add Users to Team | `addUsersToTeam` | Add members to a team |
| Remove Users From Team | `removeUsersFromTeam` | Remove members from a team |

---

## List Teams

```json
{
  "parameters": {
    "resource": "team",
    "operation": "listTeams"
  }
}
```

No additional parameters. Returns all teams in the account.

---

## Get a Team

```json
{
  "parameters": {
    "resource": "team",
    "operation": "getTeam",
    "team": "750422"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Team | `team` | options/string | Required — team ID |

---

## Create a Team

```json
{
  "parameters": {
    "resource": "team",
    "operation": "createTeam",
    "teamName": "Engineering",
    "isGuest": false,
    "userIds": ["62818631", "45779868"],
    "allowEmptyTeam": false
  }
}
```

| Parameter | Key | Type | Default | Notes |
|---|---|---|---|---|
| Team Name | `teamName` | string | — | Required |
| Is Guest | `isGuest` | boolean | `false` | Mark as a guest team |
| Users | `userIds` | multiOptions | — | Initial team members |
| Allow Empty Team | `allowEmptyTeam` | boolean | `false` | Allow creating the team with no initial members |

---

## Delete a Team

```json
{
  "parameters": {
    "resource": "team",
    "operation": "deleteTeam",
    "teamId": "1228038"
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Team ID | `teamId` | string | Required — use the raw ID string, not the dropdown |

---

## Add Users to Team

```json
{
  "parameters": {
    "resource": "team",
    "operation": "addUsersToTeam",
    "teamIds": "1228036",
    "userIds": ["35597267", "45779868"]
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Team Name | `teamIds` | options/string | Required — target team |
| Users | `userIds` | multiOptions | Required — users to add |

---

## Remove Users From Team

```json
{
  "parameters": {
    "resource": "team",
    "operation": "removeUsersFromTeam",
    "teamIds": "1228038",
    "userIds": ["62818632"]
  }
}
```

| Parameter | Key | Type | Notes |
|---|---|---|---|
| Team Name | `teamIds` | options/string | Required — target team |
| Users | `userIds` | multiOptions | Required — users to remove |

---

## Notes

- `teamIds` (for add/remove users) is the **team ID as a string**, sourced from the team dropdown. Despite the plural name, it accepts a single team.
- `teamId` (for delete) uses a plain string input — type the ID directly or use an expression.
- To find team IDs, use **List Teams** first and note the `id` in the output.
