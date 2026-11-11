import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { gateId, useSessionStatus } from "./session"

export const useCreatePlan = () => useConvexMutation(api.plans.createPlan)
export const useUpdatePlanStatus = () => useConvexMutation(api.plans.updatePlanStatus)

export function usePlansForGroup(groupId: Id<"groups"> | undefined) {
    const status = useSessionStatus()
    const gated = gateId(status, groupId)
    return useConvexQuery(api.plans.listPlansForGroup, gated.skip ? undefined : { groupId: gated.id }, {
        skip: gated.skip,
    })
}

export function usePlansForRestaurant(placeId: Id<"places"> | undefined) {
    const status = useSessionStatus()
    const gated = gateId(status, placeId)
    return useConvexQuery(api.plans.listPlansForRestaurant, gated.skip ? undefined : { placeId: gated.id }, {
        skip: gated.skip,
    })
}
