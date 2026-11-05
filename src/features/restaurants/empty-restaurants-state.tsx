import { useNavigate } from "@tanstack/react-router"
import Plus from "lucide-react/icons/plus"
import SearchX from "lucide-react/icons/search-x"
import Sparkles from "lucide-react/icons/sparkles"
import Utensils from "lucide-react/icons/utensils"

import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"

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

    const isSearching = hasFilter === true || hasSearch === true

    return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
                <div className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-tomato-100 to-tomato-200">
                    {isSearching ? (
                        <SearchX className="size-8 text-tomato-600" />
                    ) : (
                        <Utensils className="size-8 text-tomato-600" />
                    )}
                </div>
                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-tomato-400/60" />
                <div className="absolute -bottom-1 -left-1 size-2 rounded-full bg-mango-400/60" />
            </div>

            <h3 className="mb-2 font-display text-xl font-semibold text-balance text-stone-900">
                {isSearching ? "No matches found" : "The table is set, but empty"}
            </h3>

            <p className="mb-6 max-w-sm text-stone-600">
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
                    <Button onClick={onAddClick}>
                        <Plus className="size-4" />
                        Add your first restaurant
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        onClick={() => {
                            void navigate({ to: "/login", viewTransition: true })
                        }}
                    >
                        <Sparkles className="size-4" />
                        Sign in to add restaurants
                    </Button>
                ))}
        </div>
    )
}
