/* @refresh reload */
import { render } from "solid-js/web"
import "./index.css"
import { ConvexProvider } from "./core/convex-provider.tsx"
import { Home } from "./pages/home"
import { Wheel } from "./pages/wheel"
import { NotFound } from "./pages/not-found.tsx"
import { Route, Router } from "@solidjs/router"

const root = document.getElementById("root")

render(
    () => (
        <ConvexProvider>
            <Router>
                <Route path="/" component={Home} />
                <Route path="/wheel" component={Wheel} />
                <Route path="*" component={NotFound} />
            </Router>
        </ConvexProvider>
    ),
    root!,
)
