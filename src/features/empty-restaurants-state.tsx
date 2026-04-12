import { Show } from "solid-js"
import { useNavigate } from "@tanstack/solid-router"
import { Button } from "../ui/button"
import Utensils from "lucide-solid/icons/utensils"
import Plus from "lucide-solid/icons/plus"
import SearchX from "lucide-solid/icons/search-x"
import Sparkles from "lucide-solid/icons/sparkles"
import { useAuth } from "../core/hooks"

export function EmptyRestaurantsState(props: { hasFilter?: boolean; hasSearch?: boolean; onAddClick?: () => void }) {
    const navigate = useNavigate()
    const auth = useAuth()

    const isSearching = () => props.hasFilter || props.hasSearch

    return (
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
            {/* Decorative element */}
            <div class="relative mb-6">
                <div class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-100 to-flame-pea-200 dark:from-flame-pea-900/30 dark:to-flame-pea-800/20">
                    <Show
                        when={isSearching()}
                        fallback={<Utensils class="h-8 w-8 text-flame-pea-600 dark:text-flame-pea-400" />}
                    >
                        <SearchX class="h-8 w-8 text-flame-pea-600 dark:text-flame-pea-400" />
                    </Show>
                </div>
                {/* Decorative dots */}
                <div class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-flame-pea-400/60" />
                <div class="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-amber-400/60" />
            </div>

            {/* Title */}
            <h3
                class="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100"
                style={{ "font-family": "var(--font-display)" }}
            >
                <Show when={isSearching()} fallback={<>The table is set, but empty</>}>
                    <>No matches found</>
                </Show>
            </h3>

            {/* Description */}
            <p class="mb-6 max-w-sm text-neutral-600 dark:text-neutral-400">
                <Show
                    when={isSearching()}
                    fallback={
                        <>
                            Your culinary wishlist awaits its first entry.
                            <br />
                            Be the first to suggest a memorable dining experience.
                        </>
                    }
                >
                    <>Try adjusting your filters or search to discover more restaurants.</>
                </Show>
            </p>

            {/* Action */}
            <Show when={!isSearching()}>
                <Show
                    when={auth.isAuthenticated()}
                    fallback={
                        <Button variant="secondary" onClick={() => navigate({ to: "/login" })}>
                            <Sparkles class="size-4" />
                            Sign in to add restaurants
                        </Button>
                    }
                >
                    <Button onClick={props.onAddClick}>
                        <Plus class="size-4" />
                        Add your first restaurant
                    </Button>
                </Show>
            </Show>
        </div>
    )
}
