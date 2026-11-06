import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { RestaurantInterestButton } from "./restaurant-interest-button"

describe("RestaurantInterestButton", () => {
    test("toggles want-to-try through its callback", async () => {
        const user = userEvent.setup()
        const onToggleWant = vi.fn<() => void>()
        const { rerender } = render(
            <RestaurantInterestButton wanted={false} wantCount={0} onToggleWant={onToggleWant} />,
        )
        const button = screen.getByRole("button", { name: /Want to try/ })
        expect(button).toHaveAttribute("aria-pressed", "false")

        await user.click(button)
        expect(onToggleWant).toHaveBeenCalledTimes(1)

        rerender(<RestaurantInterestButton wanted wantCount={4} onToggleWant={onToggleWant} />)
        expect(screen.getByRole("button", { name: /Want to try/ })).toHaveAttribute("aria-pressed", "true")
        expect(screen.getByText("4")).toBeInTheDocument()
    })
})
