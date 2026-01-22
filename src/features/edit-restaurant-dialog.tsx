import { For, Show } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset, setInput } from "@formisch/solid"
import { useUpdateRestaurant, useFriends, type Restaurant } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input, Textarea, Select } from "../ui/field"
import { RestaurantSchema, type RestaurantOutput } from "../core/schemas"
import { EmojiRating } from "../ui/emoji-rating"

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
            rating: props.restaurant.rating ?? null,
        },
    })

    const handleSubmit = async (output: RestaurantOutput) => {
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
                            <Field of={form} path={["rating"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <EmojiRating
                                            rating={
                                                typeof field.input === "number" && field.input >= 0 ? field.input : null
                                            }
                                            onRate={(rating) => setInput(form, { path: ["rating"], input: rating })}
                                        />
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
