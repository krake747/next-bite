import { For } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset } from "@formisch/solid"
import * as v from "valibot"
import { useAddRestaurant, useFriends } from "../core/hooks"
import { Button } from "../ui/button"

const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    notes: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
})

export function AddRestaurantDialog(props: { show: boolean; onOpenChange: (open: boolean) => void }) {
    const addRestaurant = useAddRestaurant()
    const friends = useFriends()
    const form = createForm({ schema: RestaurantSchema })

    const handleSubmit = async (output: v.InferOutput<typeof RestaurantSchema>) => {
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
                                    <div>
                                        <input
                                            {...field.props}
                                            value={field.input}
                                            type="text"
                                            placeholder="Name"
                                            class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        />
                                        {field.errors && <div class="text-sm text-red-500">{field.errors[0]}</div>}
                                    </div>
                                )}
                            </Field>
                            <Field of={form} path={["cuisine"]}>
                                {(field) => (
                                    <div>
                                        <input
                                            {...field.props}
                                            value={field.input}
                                            type="text"
                                            placeholder="Cuisine"
                                            class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        />
                                        {field.errors && <div class="text-sm text-red-500">{field.errors[0]}</div>}
                                    </div>
                                )}
                            </Field>
                            <Field of={form} path={["location"]}>
                                {(field) => (
                                    <div>
                                        <input
                                            {...field.props}
                                            value={field.input}
                                            type="text"
                                            placeholder="Location"
                                            class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        />
                                        {field.errors && <div class="text-sm text-red-500">{field.errors[0]}</div>}
                                    </div>
                                )}
                            </Field>
                            <Field of={form} path={["notes"]}>
                                {(field) => (
                                    <textarea
                                        {...field.props}
                                        value={field.input || ""}
                                        placeholder="Notes (optional)"
                                        class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        rows="3"
                                    />
                                )}
                            </Field>
                            <Field of={form} path={["addedBy"]}>
                                {(field) => (
                                    <div>
                                        <select
                                            {...field.props}
                                            value={field.input}
                                            class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        >
                                            <option value="">Select friend</option>
                                            <For each={friends()} fallback={<option>Loading friends...</option>}>
                                                {(f) => <option value={f.name}>{f.name}</option>}
                                            </For>
                                        </select>
                                        {field.errors && <div class="text-sm text-red-500">{field.errors[0]}</div>}
                                    </div>
                                )}
                            </Field>
                            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
