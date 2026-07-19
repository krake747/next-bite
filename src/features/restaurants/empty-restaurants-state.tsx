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
}: {
    hasFilter?: boolean
    hasSearch?: boolean
    onAddClick?: () => void
}) {
    const navigate = useNavigate()
    const auth = useAuth()

    const isSearching = hasFilter || hasSearch

    return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-100 to-flame-pea-200 dark:from-flame-pea-900/30 dark:to-flame-pea-800/20">
                    {isSearching ? (
                        <SearchX className="h-8 w-8 text-flame-pea-600 dark:text-flame-pea-400" />
                    ) : (
                        <Utensils className="h-8 w-8 text-flame-pea-600 dark:text-flame-pea-400" />
                    )}
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-flame-pea-400/60" />
                <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-amber-400/60" />
            </div>

            <h3
                className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100"
                style={{ fontFamily: "var(--font-display)" }}
            >
                {isSearching ? "No matches found" : "The table is set, but empty"}
            </h3>

            <p className="mb-6 max-w-sm text-neutral-600 dark:text-neutral-400">
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
                    <Button variant="secondary" onClick={() => navigate({ to: "/login", viewTransition: true })}>
                        <Sparkles className="size-4" />
                        Sign in to add restaurants
                    </Button>
                ))}
        </div>
    )
}
