import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs"

describe("Tabs", () => {
    test("switches panels and reports the value", async () => {
        const onValueChange = vi.fn<(value: string | number) => void>()
        const screen = await render(
            <Tabs defaultValue="discover" onValueChange={onValueChange}>
                <TabsList>
                    <TabsTab value="discover">Discover</TabsTab>
                    <TabsTab value="saved">Saved</TabsTab>
                </TabsList>
                <TabsPanel value="discover">Discovery content</TabsPanel>
                <TabsPanel value="saved">Saved content</TabsPanel>
            </Tabs>,
        )

        await expect.element(screen.getByText("Discovery content")).toBeInTheDocument()
        await screen.getByRole("tab", { name: "Saved" }).click()
        expect(onValueChange).toHaveBeenCalledTimes(1)
        expect(onValueChange.mock.calls[0]?.[0]).toBe("saved")
        await expect.element(screen.getByText("Saved content")).toBeInTheDocument()
    })
})
