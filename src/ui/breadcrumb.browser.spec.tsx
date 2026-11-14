import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "./breadcrumb"

describe("Breadcrumb", () => {
    test("links the parent and marks the current page", async () => {
        const screen = await render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<a href="/" />}>Restaurants</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0 flex-1">
                        <BreadcrumbPage>Five Guys</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>,
        )
        await expect.element(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
        await expect.element(screen.getByRole("link", { name: "Restaurants" })).toBeInTheDocument()
        await expect.element(screen.getByText("Five Guys")).toBeInTheDocument()
        const current = screen.container.querySelector('[data-slot="breadcrumb-page"]')
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- querySelector returns Element, which lacks dataset; getAttribute is the typed API.
        expect(current?.getAttribute("aria-current")).toBe("page")
    })
})
