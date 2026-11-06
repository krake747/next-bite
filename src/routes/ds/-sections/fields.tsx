import { Card } from "@ui/card"
import { Input, Textarea, Select } from "@ui/field"

export const fieldsMeta = {
    id: "fields",
    group: "Forms",
    title: "Inputs",
    body: "Shared control treatment with error and disabled states. Select is Base UI under the same field API.",
} as const

const noop = () => {}

export function FieldsDemo() {
    return (
        <Card>
            <div className="grid w-full gap-4 p-5 sm:grid-cols-2">
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
            </div>
        </Card>
    )
}
