import { useNavigate } from "@tanstack/react-router"
import { createContext, use } from "react"

import { type Restaurant } from "@core/restaurants"
import { useAuth } from "@core/session"
import {
    emptySocialSummary,
    useSocialSummaries,
    useToggleInterest,
    useToggleLike,
    type RestaurantSocialSummary,
} from "@core/social"

export type SocialActions = {
    readonly socialFor: (restaurant: Restaurant) => RestaurantSocialSummary
    readonly toggleWantFor: (restaurant: Restaurant) => () => void
    readonly toggleLikeFor: (restaurant: Restaurant) => () => void
    readonly goToDetail: (restaurant: Restaurant) => void
    readonly goToLogin: () => void
}

const SocialActionsContext = createContext<SocialActions | null>(null)

export function useSocialActions(): SocialActions {
    const value = use(SocialActionsContext)
    if (value === null) {
        throw new Error("useSocialActions must be used inside SocialActionsProvider")
    }
    return value
}

export function SocialActionsProvider({
    restaurants,
    children,
}: Readonly<{ restaurants: ReadonlyArray<Restaurant>; children: React.ReactNode }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const isAuthenticated = auth.isAuthenticated
    const summaries = useSocialSummaries(restaurants.map((r) => r._id))
    const toggleInterest = useToggleInterest()
    const toggleLike = useToggleLike()

    const goToLogin = () => {
        void navigate({ to: "/login", viewTransition: true })
    }

    const goToDetail = (restaurant: Restaurant) => {
        void navigate({
            to: "/restaurants/$restaurantId",
            params: { restaurantId: restaurant._id },
            viewTransition: true,
        })
    }

    const socialFor = (restaurant: Restaurant): RestaurantSocialSummary =>
        summaries?.get(restaurant._id) ?? emptySocialSummary

    const toggleWantFor = (restaurant: Restaurant) => () => {
        if (!isAuthenticated) {
            goToLogin()
            return
        }
        toggleInterest.mutate({ restaurantId: restaurant._id, status: "want" })
    }

    const toggleLikeFor = (restaurant: Restaurant) => () => {
        if (!isAuthenticated) {
            goToLogin()
            return
        }
        toggleLike.mutate({ restaurantId: restaurant._id })
    }

    return (
        <SocialActionsContext.Provider value={{ socialFor, toggleWantFor, toggleLikeFor, goToDetail, goToLogin }}>
            {children}
        </SocialActionsContext.Provider>
    )
}
