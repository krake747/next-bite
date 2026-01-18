import { For } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form } from "@formisch/solid"
import * as v from "valibot"
import type { Friend } from "../core/types"

const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    notes: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
    visited: v.optional(v.boolean(), false),
})

export function AddRestaurantDialog(props: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    friends: Friend[]
    onSubmit: (output: v.InferOutput<typeof RestaurantSchema>) => void
}) {
    const restaurantForm = createForm({ schema: RestaurantSchema })

    const handleSubmit = (output: v.InferOutput<typeof RestaurantSchema>) => {
        props.onSubmit(output)
        props.onOpenChange(false)
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 bg-black/50" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Content class="w-full max-w-md rounded-lg bg-white p-6 dark:bg-neutral-800">
                        <Dialog.Title class="mb-4 text-lg font-semibold">Add Restaurant</Dialog.Title>
                        <Form of={restaurantForm} onSubmit={handleSubmit} class="space-y-4">
                            <Field of={restaurantForm} path={["name"]}>
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
                            <Field of={restaurantForm} path={["cuisine"]}>
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
                            <Field of={restaurantForm} path={["location"]}>
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
                            <Field of={restaurantForm} path={["notes"]}>
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
                            <Field of={restaurantForm} path={["addedBy"]}>
                                {(field) => (
                                    <div>
                                        <select
                                            {...field.props}
                                            value={field.input}
                                            class="w-full rounded border p-2 dark:border-neutral-600 dark:bg-neutral-700"
                                        >
                                            <option value="">Select friend</option>
                                            <For each={props.friends}>
                                                {(friend) => <option value={friend.name}>{friend.name}</option>}
                                            </For>
                                        </select>
                                        {field.errors && <div class="text-sm text-red-500">{field.errors[0]}</div>}
                                    </div>
                                )}
                            </Field>
                            <Field of={restaurantForm} path={["visited"]}>
                                {(field) => (
                                    <label class="flex items-center">
                                        <input {...field.props} type="checkbox" checked={!!field.input} class="mr-2" />
                                        Visited
                                    </label>
                                )}
                            </Field>
                            <div class="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => props.onOpenChange(false)}
                                    class="rounded border px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    class="rounded bg-flame-pea-600 px-4 py-2 text-white hover:bg-flame-pea-700"
                                >
                                    Add
                                </button>
                            </div>
                        </Form>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
