import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { usePlaceDetails } from "@core/restaurants"

export type RestaurantSignals =
    | { readonly status: "idle" }
    | { readonly status: "loading" }
    | {
          readonly status: "ready"
          readonly openState: "open" | "closed" | "unknown"
          readonly priceLevel?: string | undefined
          readonly businessStatus?: string | undefined
      }
    | { readonly status: "failed" }

export function useRestaurantSignals(placeId: Id<"places">, googlePlaceId: string | undefined): RestaurantSignals {
    const fetchDetails = usePlaceDetails()
    const [signals, setSignals] = useState<RestaurantSignals>({ status: "idle" })

    useEffect(() => {
        let cancelled = false
        if (googlePlaceId === undefined || googlePlaceId === "") {
            return () => {
                cancelled = true
            }
        }
        setSignals({ status: "loading" })
        void Promise.all([fetchDetails({ placeId, tier: "enterprise" }), fetchDetails({ placeId, tier: "pro" })])
            .then(([enterprise, pro]) => {
                if (!cancelled) {
                    setSignals({
                        status: "ready",
                        openState: "openingHours" in enterprise ? enterprise.openingHours.openState : "unknown",
                        ...("priceLevel" in enterprise && enterprise.priceLevel !== undefined
                            ? { priceLevel: enterprise.priceLevel }
                            : {}),
                        ...("businessStatus" in pro && pro.businessStatus !== undefined
                            ? { businessStatus: pro.businessStatus }
                            : {}),
                    })
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSignals({ status: "failed" })
                }
            })
        return () => {
            cancelled = true
        }
        // fetchDetails is the stable mutateAsync function; refetch only when the place changes.
    }, [placeId, googlePlaceId, fetchDetails])

    return signals
}
