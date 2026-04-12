import { createSignal, Show, onMount, type Component, type JSX } from "solid-js"
import { ConvexClient } from "convex/browser"
import { ConvexContext } from "./convex-solid"
import { authStore } from "./auth-store"
import { Loading } from "../ui/loading"

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

export const AuthProvider: Component<{ children: JSX.Element }> = (props) => {
    const [isInitialized, setIsInitialized] = createSignal(false)

    onMount(() => {
        void authStore.initializeAuth().then(() => {
            setIsInitialized(true)
        })
    })

    return (
        <Show when={isInitialized()} fallback={<Loading />}>
            <ConvexContext.Provider value={convex}>{props.children}</ConvexContext.Provider>
        </Show>
    )
}
