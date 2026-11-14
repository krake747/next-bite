import { type FieldElement, type FieldElementProps } from "@formisch/react"
import { useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { Select } from "./field"

const options = [
    { value: "", label: "Select friend" },
    { value: "Alex", label: "Alex" },
    { value: "Priya", label: "Priya" },
]

type SelectHarnessProps = {
    readonly initial: string
    readonly onChangeSpy: (event: React.ChangeEvent<FieldElement>) => void
    readonly refSpy: (element: FieldElement | null) => void
}

function SelectHarness({ initial, onChangeSpy, refSpy }: SelectHarnessProps) {
    const [input, setInput] = useState(initial)
    return (
        <Select
            input={input}
            errors={null}
            label="Added by"
            options={options}
            name="addedBy"
            autoFocus={false}
            onFocus={() => {}}
            onBlur={() => {}}
            onChange={(event) => {
                onChangeSpy(event)
                setInput(event.currentTarget.value)
            }}
            ref={refSpy}
        />
    )
}

async function setup(initial: string | undefined) {
    const onChange = vi.fn<(event: React.ChangeEvent<FieldElement>) => void>()
    let hiddenElement: FieldElement | null = null
    const ref = vi.fn<FieldElementProps["ref"]>((element) => {
        hiddenElement = element
    })
    const screen = await render(<SelectHarness initial={initial ?? ""} onChangeSpy={onChange} refSpy={ref} />)
    return { onChange, hiddenElement: () => hiddenElement, screen }
}

describe("Select", () => {
    test("commits the chosen option through the Formisch change handler", async () => {
        const { onChange, hiddenElement, screen } = await setup("")

        await screen.getByRole("combobox", { name: "Added by" }).click()
        await screen.getByRole("option", { name: "Alex" }).click()

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(hiddenElement()?.value).toBe("Alex")
    })

    test("shows the current value on the trigger", async () => {
        const { screen } = await setup("Priya")
        await expect.element(screen.getByRole("combobox", { name: "Added by" })).toHaveTextContent("Priya")
    })
})
