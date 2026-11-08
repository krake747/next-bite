import { Input, Select, Textarea } from "@ui/field"

import { Demo } from "./demo-frame"

export const fieldsMeta = {
    id: "fields",
    group: "Forms",
    title: "Inputs",
    body: "Shared control treatment with error and disabled states. Select is Base UI under the same field API.",
    importPath: "@ui/field",
    anatomy: [
        { element: "Label", description: "Names the control, linked by htmlFor." },
        { element: "Control", description: "The input itself with shared treatment and focus ring." },
        { element: "Errors", description: "Shown when invalid, wired by aria-describedby." },
    ],
} as const

const noop = () => {}

export function FieldsDemo() {
    return (
        <Demo className="grid gap-4 sm:grid-cols-2">
            <Input
                input=""
                errors={null}
                label="Name"
                placeholder="Trattoria Verde"
                name="demo"
                autoFocus={false}
                onFocus={noop}
                onBlur={noop}
                onChange={noop}
                ref={noop}
            />
            <Textarea
                input=""
                errors={null}
                label="Notes"
                placeholder="Why is it worth trying?"
                name="demo"
                autoFocus={false}
                onFocus={noop}
                onBlur={noop}
                onChange={noop}
                ref={noop}
            />
            <Select
                input=""
                errors={null}
                label="Cuisine"
                options={[
                    { value: "", label: "Select cuisine" },
                    { value: "italian", label: "Italian" },
                ]}
                name="demo"
                autoFocus={false}
                onFocus={noop}
                onBlur={noop}
                onChange={noop}
                ref={noop}
            />
            <Input
                input="Not an email"
                errors={["Enter a valid email"]}
                label="Email with error"
                name="demo"
                autoFocus={false}
                onFocus={noop}
                onBlur={noop}
                onChange={noop}
                ref={noop}
            />
        </Demo>
    )
}
