import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { OpeningHoursDialog } from "./opening-hours-dialog"

const weekdayText = [
    "Monday: 11:30 AM – 10:00 PM",
    "Tuesday: 11:30 AM – 10:00 PM",
    "Wednesday: 11:30 AM – 10:00 PM",
    "Thursday: 11:30 AM – 10:00 PM",
    "Friday: 11:30 AM – 11:00 PM",
    "Saturday: 12:00 PM – 11:00 PM",
    "Sunday: 12:00 PM – 9:00 PM",
]

describe("OpeningHoursDialog Google attribution", () => {
    test("shows Powered by Google beside the hours content", async () => {
        const screen = await render(
            <OpeningHoursDialog
                show={true}
                onOpenChange={() => {}}
                openingHours={{ openState: "open", periods: [], weekdayText }}
                failed={false}
                restaurantName="Trattoria"
            />,
        )
        await expect.element(screen.getByText("Hours")).toBeInTheDocument()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeInTheDocument()
        await expect.element(attribution).toHaveAttribute("translate", "no")
    })
})
