import { For, Show, createSignal, onCleanup } from "solid-js"
import { createForm, Field, Form, reset, setInput } from "@formisch/solid"
import {
    useAddRestaurant,
    useUpdateRestaurant,
    useFriends,
    useCleanupStorage,
    type ImageRecord,
    type Restaurant,
} from "@core/hooks"
import { Button } from "@ui/button"
import { FieldWrapper, Input, Textarea, Select } from "@ui/field"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { PlacesAutocomplete } from "@ui/places-autocomplete"
import { ImageUpload } from "@ui/image-upload"
import { EmojiRating } from "@ui/emoji-rating"

export type RestaurantFormProps =
    | { mode: "add"; onSuccess: () => void; onCancel: () => void }
    | { mode: "edit"; restaurant: Restaurant; onSuccess: () => void; onCancel: () => void }

export function RestaurantForm(props: RestaurantFormProps) {
    const addRestaurant = useAddRestaurant()
    const updateRestaurant = useUpdateRestaurant()
    const friends = useFriends()
    const cleanupStorage = useCleanupStorage()

    const initialImages = props.mode === "edit" ? props.restaurant.images : []
    const [images, setImages] = createSignal<ImageRecord[]>(initialImages)
    const [pendingRemovedStorageIds, setPendingRemovedStorageIds] = createSignal<string[]>([])

    const form = createForm({
        schema: RestaurantSchema,
        ...(props.mode === "edit"
            ? {
                  initialInput: {
                      name: props.restaurant.name,
                      cuisine: props.restaurant.cuisine,
                      location: props.restaurant.location ?? "",
                      lat: props.restaurant.lat,
                      lng: props.restaurant.lng,
                      notes: props.restaurant.notes ?? "",
                      link: props.restaurant.link ?? "",
                      addedBy: props.restaurant.addedBy,
                      rating: props.restaurant.rating,
                  },
              }
            : {}),
    })

    const cleanupImages = async () => {
        if (props.mode === "add") {
            for (const img of images()) {
                try {
                    await cleanupStorage({ storageId: img.storageId })
                } catch {
                    // Storage may already be deleted or not exist
                }
            }
            for (const storageId of pendingRemovedStorageIds()) {
                try {
                    await cleanupStorage({ storageId })
                } catch {
                    // Storage may already be deleted or not exist
                }
            }
            setPendingRemovedStorageIds([])
        }
        setImages([])
    }

    const handleClose = async () => {
        await cleanupImages()
        reset(form)
        props.onCancel()
    }

    onCleanup(() => {
        if (props.mode === "add") {
            cleanupImages()
        }
    })

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
            if (props.mode === "add") {
                await addRestaurant({ ...output, images: images() })
                for (const storageId of pendingRemovedStorageIds()) {
                    try {
                        await cleanupStorage({ storageId })
                    } catch {
                        // Storage may already be deleted or not exist
                    }
                }
                setPendingRemovedStorageIds([])
            } else {
                await updateRestaurant({ id: props.restaurant._id, ...output, images: images() })
            }
            reset(form)
            setImages([])
            props.onSuccess()
        } catch (error) {
            console.error(`Error ${props.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    return (
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
                            <Select {...field.props} input={field.input} errors={field.errors} label="Added by">
                                <option value="">Select friend</option>
                                <Show when={friends()}>
                                    {(friends) => (
                                        <For each={friends()}>
                                            {(f) => (
                                                <option value={f.name} selected={field.input === f.name}>
                                                    {f.name}
                                                </option>
                                            )}
                                        </For>
                                    )}
                                </Show>
                            </Select>
                        </FieldWrapper>
                    )}
                </Field>
            </div>
            <Show when={props.mode === "edit"}>
                <Field of={form} path={["rating"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Rating
                            </label>
                            <div class="mt-2">
                                <EmojiRating
                                    rating={typeof field.input === "number" && field.input >= 1 ? field.input : null}
                                    onRate={(rating) => setInput(form, { path: ["rating"], input: rating })}
                                />
                            </div>
                        </FieldWrapper>
                    )}
                </Field>
            </Show>
            <ImageUpload
                images={images()}
                onImagesChange={setImages}
                maxImages={5}
                {...(props.mode === "edit"
                    ? { restaurantId: props.restaurant._id }
                    : { onRemove: (storageId) => setPendingRemovedStorageIds((prev) => [...prev, storageId]) })}
            />
            <div class="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={handleClose}>
                    {props.mode === "add" ? "Cancel" : "Cancel"}
                </Button>
                <Button type="submit">{props.mode === "add" ? "Add Restaurant" : "Save Changes"}</Button>
            </div>
        </Form>
    )
}
