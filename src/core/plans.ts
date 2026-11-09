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

export function usePlansForRestaurant(restaurantId: Id<"restaurants"> | undefined) {
    const status = useSessionStatus()
    const gated = gateId(status, restaurantId)
    return useConvexQuery(api.plans.listPlansForRestaurant, gated.skip ? undefined : { restaurantId: gated.id }, {
        skip: gated.skip,
    })
}
