import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs"

describe("Tabs", () => {
    test("switches panels and reports the value", async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn<(value: string | number) => void>()
        render(
            <Tabs defaultValue="discover" onValueChange={onValueChange}>
                <TabsList>
                    <TabsTab value="discover">Discover</TabsTab>
                    <TabsTab value="saved">Saved</TabsTab>
                </TabsList>
                <TabsPanel value="discover">Discovery content</TabsPanel>
                <TabsPanel value="saved">Saved content</TabsPanel>
            </Tabs>,
        )

        expect(screen.getByText("Discovery content")).toBeInTheDocument()
        await user.click(screen.getByRole("tab", { name: "Saved" }))
        expect(onValueChange).toHaveBeenCalledTimes(1)
        expect(onValueChange.mock.calls[0]?.[0]).toBe("saved")
        expect(screen.getByText("Saved content")).toBeInTheDocument()
    })
})
