import { For, Show, createSignal } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { createForm, Field, Form, reset, setInput } from "@formisch/solid"
import { useAddRestaurant, useFriends, useAuth } from "../../core/hooks"
import { Button } from "../../ui/button"
import { FieldWrapper, Input, Textarea, Select } from "../../ui/field"
import { RestaurantSchema, type RestaurantOutput } from "../../core/schemas"
import { PlacesAutocomplete } from "../../ui/places-autocomplete"
import { ImageUpload } from "../../ui/image-upload"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"

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
        } else {
            setInput(form, { path: ["lat"], input: undefined })
            setInput(form, { path: ["lng"], input: undefined })
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
                <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Content class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <div class="mb-6 flex items-center gap-3">
                            <div class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white dark:from-flame-pea-600 dark:to-flame-pea-700">
                                <UtensilsCrossed class="size-5" />
                            </div>
                            <Dialog.Title
                                class="text-xl font-semibold text-neutral-900 dark:text-white"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                Add Restaurant
                            </Dialog.Title>
                        </div>

                        <Show
                            when={auth.isAuthenticated()}
                            fallback={
                                <div class="space-y-4 py-8 text-center">
                                    <p class="text-neutral-600 dark:text-neutral-400">
                                        Please sign in to add restaurants.
                                    </p>
                                    <Button as="a" href="/login" class="w-full">
                                        Sign In
                                    </Button>
                                </div>
                            }
                        >
                            <Form of={form} onSubmit={handleSubmit} class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <Field of={form} path={["name"]}>
                                        {(field) => (
                                            <FieldWrapper errors={field.errors}>
                                                <Input
                                                    {...field.props}
                                                    input={field.input}
                                                    errors={field.errors}
                                                    label="Restaurant name"
                                                    placeholder="The fancy burger place"
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
                                                    label="Cuisine"
                                                    placeholder="Burgers, Italian, etc."
                                                />
                                            </FieldWrapper>
                                        )}
                                    </Field>
                                </div>
                                <Field of={form} path={["location"]}>
                                    {(field) => (
                                        <FieldWrapper errors={field.errors}>
                                            <PlacesAutocomplete
                                                value={field.input ?? ""}
                                                onChange={handleLocationChange}
                                                label="Location"
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
                                                label="Notes"
                                                placeholder="What to order..."
                                                rows={3}
                                            />
                                        </FieldWrapper>
                                    )}
                                </Field>
                                <div class="grid grid-cols-2 gap-4">
                                    <Field of={form} path={["link"]}>
                                        {(field) => (
                                            <FieldWrapper errors={field.errors}>
                                                <Input
                                                    {...field.props}
                                                    input={field.input}
                                                    errors={field.errors}
                                                    type="url"
                                                    label="Menu link"
                                                    placeholder="https://menu.com/..."
                                                />
                                            </FieldWrapper>
                                        )}
                                    </Field>
                                    <Field of={form} path={["addedBy"]}>
                                        {(field) => (
                                            <FieldWrapper errors={field.errors}>
                                                <Select
                                                    {...field.props}
                                                    input={field.input}
                                                    errors={field.errors}
                                                    label="Added by"
                                                >
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
                                </div>
                                <ImageUpload images={images()} onImagesChange={setImages} maxImages={5} />
                                <div class="flex justify-end gap-2 pt-2">
                                    <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Add Restaurant</Button>
                                </div>
                            </Form>
                        </Show>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
