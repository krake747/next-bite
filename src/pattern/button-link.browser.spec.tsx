import {
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router"
import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { ButtonLink } from "./button-link"

function Shell() {
    return (
        <>
            <ButtonLink to="/groups" tone="secondary">
                Groups
            </ButtonLink>
            <Outlet />
        </>
    )
}

const rootRoute = createRootRoute({ component: Shell })
const groupsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/groups",
    component: () => <h1>Groups</h1>,
})
const routeTree = rootRoute.addChildren([groupsRoute])

async function renderAt(path: string) {
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
    })
    await router.load()
    return render(<RouterProvider router={router} />)
}

describe("ButtonLink", () => {
    test("renders a link with button styling", async () => {
        const screen = await renderAt("/")

        const link = screen.getByRole("link", { name: "Groups" })
        await expect.element(link).toBeInTheDocument()
        await expect.element(link).toHaveAttribute("href", "/groups")
        await expect.element(link).toHaveAttribute("data-slot", "button-link")
    })

    test("navigates on click", async () => {
        const screen = await renderAt("/")

        await screen.getByRole("link", { name: "Groups" }).click()
        await expect.element(screen.getByRole("heading", { name: "Groups" })).toBeInTheDocument()
    })
})
