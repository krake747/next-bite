/* @refresh reload */
import { render } from "solid-js/web"
import "./index.css"
import { AuthProvider } from "./core/auth-provider.tsx"
import { Home } from "./pages/home"
import { Wheel } from "./pages/wheel"
import { Login } from "./pages/login"
import { Signup } from "./pages/signup"
import { NotFound } from "./pages/not-found.tsx"
import { Route, Router } from "@solidjs/router"

const root = document.getElementById("root")
if (!root) {
    throw new Error("Root element not found")
}

render(
    () => (
        <AuthProvider>
            <Router>
                <Route path="/" component={Home} />
                <Route path="/wheel" component={Wheel} />
                <Route path="/login" component={Login} />
                <Route path="/signup" component={Signup} />
                <Route path="*" component={NotFound} />
            </Router>
        </AuthProvider>
    ),
    root,
)
