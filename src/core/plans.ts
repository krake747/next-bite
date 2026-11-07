import { useConvexMutation, useConvexQuery } from "@api/convex-client"
import { type Id } from "@api/data-model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"

export const useCreatePlan = () => useConvexMutation(api.plans.createPlan)
export const useUpdatePlanStatus = () => useConvexMutation(api.plans.updatePlanStatus)

export function usePlansForGroup(groupId: Id<"groups"> | null | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || groupId === null || groupId === undefined
    return useConvexQuery(
        api.plans.listPlansForGroup,
        skip || groupId === null || groupId === undefined ? undefined : { groupId },
        {
            skip,
        },
    )
}

export function usePlansForRestaurant(restaurantId: Id<"restaurants"> | null | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || restaurantId === null || restaurantId === undefined
    return useConvexQuery(
        api.plans.listPlansForRestaurant,
        skip || restaurantId === null || restaurantId === undefined ? undefined : { restaurantId },
        {
            skip,
        },
    )
}
