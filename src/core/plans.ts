import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { gateId, useSessionStatus } from "./session"

export const useCreatePlan = () => useConvexMutation(api.plans.create)
export const useCancelPlan = () => useConvexMutation(api.plans.cancel)

export function usePlansForGroup(groupId: Id<"groups"> | undefined) {
    const status = useSessionStatus()
    const gated = gateId(status, groupId)
    return useConvexQuery(api.plans.forGroup, gated.skip ? undefined : { groupId: gated.id }, {
        skip: gated.skip,
    })
}
