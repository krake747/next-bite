import { For, Show } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset } from "@formisch/solid"
import * as v from "valibot"
import { useUpdateRestaurant, useFriends, type Restaurant } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input, Textarea, Select } from "../ui/field"

const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
})

export function EditRestaurantDialog(props: {
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurant: Restaurant
}) {
    const updateRestaurant = useUpdateRestaurant()
    const friends = useFriends()
    const form = createForm({
        schema: RestaurantSchema,
        initialInput: {
            name: props.restaurant.name,
            cuisine: props.restaurant.cuisine,
            location: props.restaurant.location,
            notes: props.restaurant.notes ?? "",
            link: props.restaurant.link ?? "",
            addedBy: props.restaurant.addedBy,
        },
    })

    const handleSubmit = async (output: v.InferOutput<typeof RestaurantSchema>) => {
        try {
            await updateRestaurant({ id: props.restaurant._id, ...output })
            reset(form)
            props.onOpenChange(false)
        } catch (error) {
            console.error("Error updating restaurant:", error)
        }
    }

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 bg-black/50" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Content class="w-full max-w-md rounded-lg bg-white p-6 dark:bg-neutral-800">
                        <Dialog.Title class="mb-4 text-lg font-semibold">Edit Restaurant</Dialog.Title>
                        <Form of={form} onSubmit={handleSubmit} class="space-y-4">
                            <Field of={form} path={["name"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Input field={field} placeholder="Name" />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["cuisine"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Input field={field} placeholder="Cuisine" />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["location"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Input field={field} placeholder="Location" />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["notes"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Textarea field={field} placeholder="Notes (optional)" />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["link"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Input field={field} type="url" placeholder="Link (optional)" />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Field of={form} path={["addedBy"]}>
                                {(field) => (
                                    <FieldWrapper field={field}>
                                        <Select field={field}>
                                            <option value="">Select friend</option>
                                            <Show when={friends()} fallback={<option>Loading friends...</option>}>
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
                                <Button onClick={() => props.onOpenChange(false)}>Cancel</Button>
                                <Button type="submit">Update</Button>
                            </div>
                        </Form>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
