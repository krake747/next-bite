import { ForkKnifeIcon, MagnifyingGlassIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"

import { useAuth } from "@core/session"
import { Button } from "@ui/button"

import { useOpenAddRestaurant } from "./add-restaurant-provider"

export function EmptyRestaurantsState({
    hasFilter,
    hasSearch,
    onAddClick,
}: Readonly<{
    hasFilter?: boolean | undefined
    hasSearch?: boolean | undefined
    onAddClick?: (() => void) | undefined
}>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const openAdd = useOpenAddRestaurant()

    const isSearching = hasFilter === true || hasSearch === true

    return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
                <div className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-tomato-100 to-tomato-200">
                    {isSearching ? (
                        <MagnifyingGlassIcon className="size-8 text-tomato-600" />
                    ) : (
                        <ForkKnifeIcon className="size-8 text-tomato-600" />
                    )}
                </div>
                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-tomato-400/60" />
                <div className="absolute -bottom-1 -left-1 size-2 rounded-full bg-mango-400/60" />
            </div>

            <h3 className="mb-2 font-display text-xl font-semibold text-balance text-foreground">
                {isSearching ? "No matches found" : "The table is set, but empty"}
            </h3>

            <p className="mb-6 max-w-sm text-muted-foreground">
                {isSearching ? (
                    "Try adjusting your filters or search to discover more restaurants."
                ) : (
                    <span>
                        Your culinary wishlist awaits its first entry.
                        <br />
                        Be the first to suggest a memorable dining experience.
                    </span>
                )}
            </p>

            {!isSearching &&
                (auth.isAuthenticated ? (
                    <Button onClick={onAddClick ?? openAdd}>
                        <PlusIcon className="size-4" />
                        Add your first restaurant
                    </Button>
                ) : (
                    <Button
                        tone="secondary"
                        onClick={() => {
                            void navigate({ to: "/login" })
                        }}
                    >
                        <SparkleIcon className="size-4" />
                        Sign in to add restaurants
                    </Button>
                ))}
        </div>
    )
}
