import { onMount, type Component, type JSX } from "solid-js"
import { ConvexClient } from "convex/browser"
import { ConvexContext } from "./convex-solid"
import { authStore } from "./auth-store"

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

export const AuthProvider: Component<{ children: JSX.Element }> = (props) => {
    onMount(() => {
        void authStore.initializeAuth()
    })

    return <ConvexContext.Provider value={convex}>{props.children}</ConvexContext.Provider>
}
