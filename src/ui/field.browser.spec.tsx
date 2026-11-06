import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { Select } from "./field"

const options = [
    { value: "", label: "Select friend" },
    { value: "Alex", label: "Alex" },
    { value: "Priya", label: "Priya" },
]

function setup(input: string | undefined) {
    const onChange = vi.fn<(event: Event) => void>()
    let hiddenElement: HTMLSelectElement | null = null
    const ref = vi.fn<(element: HTMLSelectElement | null) => void>((element) => {
        hiddenElement = element
    })
    render(
        <Select
            input={input}
            errors={null}
            label="Added by"
            options={options}
            name="addedBy"
            autoFocus={false}
            onFocus={() => {}}
            onBlur={() => {}}
            onChange={onChange}
            ref={ref}
        />,
    )
    return { onChange, hiddenElement: () => hiddenElement }
}

describe("Select", () => {
    test("commits the chosen option through the Formisch change handler", async () => {
        const user = userEvent.setup()
        const { onChange, hiddenElement } = setup("")

        await user.click(screen.getByRole("combobox", { name: "Added by" }))
        await user.click(screen.getByRole("option", { name: "Alex" }))

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(hiddenElement()?.value).toBe("Alex")
    })

    test("shows the current value on the trigger", () => {
        setup("Priya")
        expect(screen.getByRole("combobox", { name: "Added by" })).toHaveTextContent("Priya")
    })
})
