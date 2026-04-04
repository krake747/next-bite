import { createSignal, Show, onMount, type Component, type JSX } from "solid-js"
import { ConvexClient } from "convex/browser"
import { ConvexContext } from "./convex-solid"
import { authStore } from "./auth-store"
import LoaderPinwheel from "lucide-solid/icons/loader-pinwheel"

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

export const AuthProvider: Component<{ children: JSX.Element }> = (props) => {
    const [isInitialized, setIsInitialized] = createSignal(false)

    onMount(() => {
        void authStore.initializeAuth().then(() => {
            setIsInitialized(true)
        })
    })

    return (
        <Show
            when={isInitialized()}
            fallback={
                <div class="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                    <div class="text-center">
                        <div class="inline-flex size-12 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600">
                            <LoaderPinwheel class="size-6 animate-spin" aria-hidden="true" />
                        </div>
                        <p class="mt-4 text-neutral-600 dark:text-neutral-400">Initializing...</p>
                    </div>
                </div>
            }
        >
            <ConvexContext.Provider value={convex}>{props.children}</ConvexContext.Provider>
        </Show>
    )
}
