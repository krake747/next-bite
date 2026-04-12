import { For, Show, createSignal } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset, setInput } from "@formisch/solid"
import { useAddRestaurant, useFriends, useAuth } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input, Textarea, Select } from "../ui/field"
import { RestaurantSchema, type RestaurantOutput } from "../core/schemas"
import { PlacesAutocomplete } from "../ui/places-autocomplete"
import { ImageUpload } from "../ui/image-upload"

export function AddRestaurantDialog(props: { show: boolean; onOpenChange: (open: boolean) => void }) {
    const addRestaurant = useAddRestaurant()
    const friends = useFriends()
    const auth = useAuth()
    const [images, setImages] = createSignal<string[]>([])

    const form = createForm({ schema: RestaurantSchema })

    const handleLocationChange = (address: string, lat?: number, lng?: number) => {
        setInput(form, { path: ["location"], input: address })
        if (lat != null && lng != null) {
            setInput(form, { path: ["lat"], input: lat })
            setInput(form, { path: ["lng"], input: lng })
        }
    }

    const handleSubmit = async (output: RestaurantOutput) => {
        try {
            await addRestaurant({ ...output, images: images() })
            reset(form)
            setImages([])
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
                    <Dialog.Content class="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-neutral-800">
                        <Dialog.Title class="mb-4 text-lg font-semibold">Add Restaurant</Dialog.Title>

                        <Show
                            when={auth.isAuthenticated()}
                            fallback={
                                <div class="space-y-4 text-center">
                                    <p class="text-neutral-600 dark:text-neutral-400">
                                        Please sign in to add restaurants.
                                    </p>
                                    <a href="/login">
                                        <Button class="w-full">Sign In</Button>
                                    </a>
                                </div>
                            }
                        >
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
                                            <PlacesAutocomplete
                                                value={field.input ?? ""}
                                                onChange={handleLocationChange}
                                                placeholder="Search for a restaurant..."
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
                                <ImageUpload images={images()} onImagesChange={setImages} maxImages={5} />
                                <div class="flex justify-end gap-2">
                                    <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Add</Button>
                                </div>
                            </Form>
                        </Show>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
