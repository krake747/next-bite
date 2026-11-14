import { act } from "@testing-library/react"
import { useId } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import { SidebarMenuButton, SidebarProvider, SidebarTrigger } from "./sidebar"
import { TooltipProvider } from "./tooltip"

function stubDesktopMedia() {
    const matchMedia = (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        // oxlint-disable-next-line typescript/no-deprecated -- deprecated members required by the DOM MediaQueryList type for the stub
        addListener: () => {},
        // oxlint-disable-next-line typescript/no-deprecated -- deprecated members required by the DOM MediaQueryList type for the stub
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    })
    window.matchMedia = matchMedia
}

function Probe() {
    return <span data-probe={useId()} />
}

function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <TooltipProvider>{children}</TooltipProvider>
        </SidebarProvider>
    )
}

function triggerId(html: string, slot: string): string | null {
    const container = document.createElement("div")
    container.innerHTML = html
    return container.querySelector(`[data-slot="${slot}"]`)?.getAttribute("id") ?? null
}

async function hydrate(html: string, node: React.ReactNode): Promise<unknown[]> {
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const errors: unknown[] = []
    await act(async () => {
        hydrateRoot(container, node, {
            onRecoverableError: (error) => {
                errors.push(error)
            },
        })
        await Promise.resolve()
    })
    return errors
}

describe("sidebar trigger ids", () => {
    beforeEach(() => {
        stubDesktopMedia()
    })

    afterEach(() => {
        document.body.innerHTML = ""
    })

    test("SidebarTrigger keeps its caller id when sibling generated ids shift", () => {
        const one = renderToString(
            <Shell>
                <Probe />
                <SidebarTrigger id="stable-trigger" />
            </Shell>,
        )
        const two = renderToString(
            <Shell>
                <Probe />
                <Probe />
                <SidebarTrigger id="stable-trigger" />
            </Shell>,
        )

        expect(triggerId(one, "sidebar-trigger")).toBe("stable-trigger")
        expect(triggerId(two, "sidebar-trigger")).toBe("stable-trigger")
    })

    test("SidebarMenuButton keeps its caller id when sibling generated ids shift", () => {
        const menuButton = (
            <SidebarMenuButton id="stable-menu-button" render={<a href="/ds">Overview</a>} tooltip="Overview">
                <span>Overview</span>
            </SidebarMenuButton>
        )
        const one = renderToString(
            <Shell>
                <Probe />
                {menuButton}
            </Shell>,
        )
        const two = renderToString(
            <Shell>
                <Probe />
                <Probe />
                {menuButton}
            </Shell>,
        )

        expect(triggerId(one, "sidebar-menu-button")).toBe("stable-menu-button")
        expect(triggerId(two, "sidebar-menu-button")).toBe("stable-menu-button")
    })

    test("SidebarTrigger hydrates without a mismatch", async () => {
        const node = (
            <Shell>
                <SidebarTrigger id="stable-trigger" />
            </Shell>
        )
        const html = renderToString(node)
        expect(html).toContain('id="stable-trigger"')

        const errors = await hydrate(html, node)

        expect(errors).toEqual([])
    })
})
