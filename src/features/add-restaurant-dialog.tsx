import { For, Show } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset } from "@formisch/solid"
import { useAddRestaurant, useFriends } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input, Textarea, Select } from "../ui/field"
import { RestaurantSchema, type RestaurantOutput } from "../core/schemas"

export function AddRestaurantDialog(props: { show: boolean; onOpenChange: (open: boolean) => void }) {
    const addRestaurant = useAddRestaurant()
    const friends = useFriends()
    const form = createForm({ schema: RestaurantSchema })

    const handleSubmit = async (output: RestaurantOutput) => {
        try {
            await addRestaurant(output)
            reset(form)
            props.onOpenChange(false)
        } catch (error) {
            console.error("Error adding restaurant:", error)
        }
    }

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 bg-black/50" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Content class="w-full max-w-md rounded-lg bg-white p-6 dark:bg-neutral-800">
                        <Dialog.Title class="mb-4 text-lg font-semibold">Add Restaurant</Dialog.Title>
                        <Form of={form} onSubmit={handleSubmit} class="space-y-4">
                            <Field of={form} path={["name"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Input
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            placeholder="Name"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["cuisine"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Input
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            placeholder="Cuisine"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["location"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Input
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            placeholder="Location"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["notes"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Textarea
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            placeholder="Notes (optional)"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["link"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Input
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            type="url"
                                            placeholder="Link (optional)"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["addedBy"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Select {...field.props} input={field.input} errors={field.errors}>
                                            <option value="">Select friend</option>
                                            <Show when={friends()}>
                                                {(friends) => (
                                                    <For each={friends()}>
                                                        {(f) => <option value={f.name}>{f.name}</option>}
                                                    </For>
                                                )}
                                            </Show>
                                        </Select>
                                    </FieldWrapper>
                                )}
                            </Field>
                            <div class="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Add</Button>
                            </div>
                        </Form>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
