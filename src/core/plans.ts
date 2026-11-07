import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"

export const useCreatePlan = () => useConvexMutation(api.plans.createPlan)
export const useUpdatePlanStatus = () => useConvexMutation(api.plans.updatePlanStatus)

export function usePlansForGroup(groupId: Id<"groups"> | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || groupId === undefined
    return useConvexQuery(api.plans.listPlansForGroup, skip || groupId === undefined ? undefined : { groupId }, {
        skip,
    })
}

export function usePlansForRestaurant(restaurantId: Id<"restaurants"> | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || restaurantId === undefined
    return useConvexQuery(
        api.plans.listPlansForRestaurant,
        skip || restaurantId === undefined ? undefined : { restaurantId },
        {
            skip,
        },
    )
}
