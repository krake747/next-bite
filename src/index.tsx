/* @refresh reload */
import { render } from "solid-js/web"
import "./index.css"
import { App } from "./app.tsx"
import { ConvexProvider } from "./core/convex-provider.tsx"

const root = document.getElementById("root")

render(
    () => (
        <ConvexProvider>
            <App />
        </ConvexProvider>
    ),
    root!,
)
