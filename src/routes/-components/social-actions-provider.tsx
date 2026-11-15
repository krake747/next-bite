import { useNavigate } from "@tanstack/react-router"
import { createContext, use } from "react"

import { type Restaurant } from "@core/restaurants"
import { useSetSave } from "@core/saves"
import { useAuth } from "@core/session"
import { type RestaurantCardOverlay } from "@features/restaurants/restaurant-card-overlay"
import { type WantState } from "@features/social/want-bar"

export type SocialActions = {
    readonly toggleWantFor: (restaurant: Restaurant) => () => void
    readonly goToDetail: (restaurant: Restaurant) => void
    readonly goToLogin: () => void
    readonly wantFor: (restaurant: Restaurant) => WantState
    readonly cardFor: (restaurant: Restaurant) => Omit<React.ComponentProps<typeof RestaurantCardOverlay>, "restaurant">
}

const SocialActionsContext = createContext<SocialActions | null>(null)

export function useSocialActions(): SocialActions {
    const value = use(SocialActionsContext)
    if (value === null) {
        throw new Error("useSocialActions must be used inside SocialActionsProvider")
    }
    return value
}

export function SocialActionsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const isAuthenticated = auth.isAuthenticated
    const setSave = useSetSave()

    const goToLogin = () => {
        void navigate({ to: "/login" })
    }

    const goToDetail = (restaurant: Restaurant) => {
        void navigate({
            to: "/restaurants/$restaurantId",
            params: { restaurantId: restaurant._id },
        })
    }

    const toggleWantFor = (restaurant: Restaurant) => () => {
        if (!isAuthenticated) {
            goToLogin()
            return
        }
        setSave.mutate({ placeId: restaurant._id, status: restaurant.mySave === "want" ? null : "want" })
    }

    const wantFor: SocialActions["wantFor"] = (restaurant) => ({
        wanted: restaurant.mySave === "want",
        wantCount: restaurant.wantCount,
        onToggleWant: toggleWantFor(restaurant),
    })

    const cardFor: SocialActions["cardFor"] = (restaurant) => ({
        onToggleWant: toggleWantFor(restaurant),
        detailsHref: `/restaurants/${restaurant._id}`,
    })

    return (
        <SocialActionsContext.Provider value={{ toggleWantFor, goToDetail, goToLogin, wantFor, cardFor }}>
            {children}
        </SocialActionsContext.Provider>
    )
}
