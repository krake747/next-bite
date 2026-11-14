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
        void fetchDetails({ placeId, tier: "combined" })
            .then((result) => {
                if (!cancelled) {
                    setSignals({
                        status: "ready",
                        openState: "openingHours" in result ? result.openingHours.openState : "unknown",
                        ...("priceLevel" in result && result.priceLevel !== undefined
                            ? { priceLevel: result.priceLevel }
                            : {}),
                        ...("businessStatus" in result && result.businessStatus !== undefined
                            ? { businessStatus: result.businessStatus }
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
