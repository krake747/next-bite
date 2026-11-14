import { act } from "@testing-library/react"
import { useId } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, test } from "vitest"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

function Probe() {
    return <span data-probe={useId()} />
}

function triggerId(html: string): string | null {
    const container = document.createElement("div")
    container.innerHTML = html
    return container.querySelector('[data-slot="dropdown-menu-trigger"]')?.getAttribute("id") ?? null
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

function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger id="stable-menu-trigger">{children}</DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Rename group</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

describe("dropdown-menu trigger ids", () => {
    afterEach(() => {
        document.body.innerHTML = ""
    })

    test("DropdownMenuTrigger keeps its caller id when sibling generated ids shift", () => {
        const one = renderToString(
            <>
                <Probe />
                <Shell>
                    <span>Group actions</span>
                </Shell>
            </>,
        )
        const two = renderToString(
            <>
                <Probe />
                <Probe />
                <Shell>
                    <span>Group actions</span>
                </Shell>
            </>,
        )

        expect(triggerId(one)).toBe("stable-menu-trigger")
        expect(triggerId(two)).toBe("stable-menu-trigger")
    })

    test("DropdownMenuTrigger hydrates without a mismatch", async () => {
        const node = (
            <Shell>
                <span>Group actions</span>
            </Shell>
        )
        const html = renderToString(node)
        expect(html).toContain('id="stable-menu-trigger"')

        const errors = await hydrate(html, node)

        expect(errors).toEqual([])
    })
})
