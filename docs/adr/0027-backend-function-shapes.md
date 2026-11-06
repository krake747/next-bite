# Backend function shapes: not-found, returns, errors, verbs

Queries, mutations, and actions answered the same situations in different ways: missing rows
returned null in some reads and threw in others, mutations returned ids, voids, and toggle nulls
with no rule, error strings mixed `Unauthorized:` prefixes with bare not-founds, and verbs varied
per domain. Callers memorized per-function behavior.

**Considered Options**

- **Normalize everything now (rename verbs, unify all returns)**: Rejected because public function
  names are the deployed API: renames need a delete-plus-create deploy with client coordination,
  which dwarfs the value of prettier verbs.
- **Rule the shapes, migrate only what is free**: Accepted. Queries return null for missing or
  invisible rows so strangers learn nothing, not even existence. Mutations throw through the shared
  `require*` guards. New mutations return the affected document id; existing voids stay until a
  caller needs the id. Error strings keep the `Unauthorized:` prefix for auth failures and plain
  sentences otherwise. New functions prefer `create`, `update`, `remove`, `get`, and `list`;
  existing verbs stay.

**Consequences**

- Shared authz guards live in the helpers module next to `requireUserId`, never duplicated per
  domain. The auth-user reader has one home; display-name formatting builds on it.
- Reviewers check new functions against the four rules and reject new verbs outside the table
  without a note. The old verbs are grandfathered, not exemplary.
- `docs/agents/testing.md` contract specs keep asserting the documented shapes.
