import { ConvexClient } from "convex/browser"
import { ConvexContext } from "./convex-solid"
import { type Component } from "solid-js"

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

export const ConvexProvider: Component<{ children: any }> = (props) => (
    <ConvexContext.Provider value={convex}>{props.children}</ConvexContext.Provider>
)
