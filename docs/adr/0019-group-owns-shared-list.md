# Group owns the shared list

A group is its shared collection. There is no separate personal collection entity: the `collections`
and `collectionItems` tables and the `collections` backend module were deleted, and preview data
starts clean with no migration.

**Considered Options**

- **Keep independent collections alongside groups**: Rejected because two list models split the
  product and every group list needed a parallel collection.
- **Migrate collection rows into groups**: Rejected because no shipped data depends on the old
  model; the v2 line had not released.
- **Drop and read groups through shares**: Accepted. Membership plus restaurant-to-group shares
  already governed access; the only missing read was listing a group's places.

**Consequences**

- `shares.shareWithGroup` records the target group id alongside the share target so
  `shares.listForGroup` stays indexed. Member-only reads; strangers are rejected.
- Group lists render from `shares.listForGroup`, never from a second surface.
- Feed and detail keep resolving through the shared visibility check.
