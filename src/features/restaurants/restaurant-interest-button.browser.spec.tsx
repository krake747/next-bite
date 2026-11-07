import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { RestaurantInterestButton } from "./restaurant-interest-button"

describe("RestaurantInterestButton", () => {
    test("toggles want-to-try through its callback", async () => {
        const onToggleWant = vi.fn<() => void>()
        const screen = await render(
            <RestaurantInterestButton wanted={false} wantCount={0} onToggleWant={onToggleWant} />,
        )
        const button = screen.getByRole("button", { name: /Want to try/ })
        await expect.element(button).toHaveAttribute("aria-pressed", "false")

        await button.click()
        expect(onToggleWant).toHaveBeenCalledTimes(1)

        await screen.rerender(<RestaurantInterestButton wanted wantCount={4} onToggleWant={onToggleWant} />)
        await expect
            .element(screen.getByRole("button", { name: /Want to try/ }))
            .toHaveAttribute("aria-pressed", "true")
        await expect.element(screen.getByText("4")).toBeInTheDocument()
    })
})
