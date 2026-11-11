import { defineSchema } from "convex/server"

import { groupsTables } from "./model/groups/schema"
import { identityTables } from "./model/identity/schema"
import { placesTables } from "./model/places/schema"
import { plansTables } from "./model/plans/schema"
import { socialTables } from "./model/social/schema"

export default defineSchema({
    ...identityTables,
    ...socialTables,
    ...groupsTables,
    ...placesTables,
    ...plansTables,
})
