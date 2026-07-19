import { useState } from "react"
import { useForm, Field, Form, reset, setInput } from "@formisch/react"
import {
    useAddRestaurantWithHours,
    useUpdateRestaurant,
    useFriends,
    useCleanupStorage,
    type ImageRecord,
    type Restaurant,
} from "@core/hooks"
import { Button } from "@ui/button"
import { FieldWrapper, Input, Textarea, Select } from "@ui/field"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { PlacesAutocomplete } from "@pattern/places-autocomplete"
import { ImageUpload } from "@pattern/image-upload"
import { EmojiRating } from "@pattern/emoji-rating"

export type RestaurantFormProps =
    | { mode: "add"; onSuccess: () => void; onCancel: () => void }
    | { mode: "edit"; restaurant: Restaurant; onSuccess: () => void; onCancel: () => void }

export function RestaurantForm(props: RestaurantFormProps) {
    const addRestaurantWithHours = useAddRestaurantWithHours()
    const updateRestaurant = useUpdateRestaurant()
    const friends = useFriends()
    const cleanupStorage = useCleanupStorage()

    const initialImages = props.mode === "edit" ? (props.restaurant.images ?? []) : []
    const [images, setImages] = useState<ImageRecord[]>(initialImages)
    const [pendingRemovedStorageIds, setPendingRemovedStorageIds] = useState<string[]>([])

    const form = useForm({
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
            for (const img of images) {
                try {
                    await cleanupStorage.mutateAsync({ storageId: img.storageId })
                } catch {}
            }
            for (const storageId of pendingRemovedStorageIds) {
                try {
                    await cleanupStorage.mutateAsync({ storageId })
                } catch {}
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
                await addRestaurantWithHours.mutateAsync({ ...output, images })
                for (const storageId of pendingRemovedStorageIds) {
                    try {
                        await cleanupStorage.mutateAsync({ storageId })
                    } catch {}
                }
                setPendingRemovedStorageIds([])
            } else {
                await updateRestaurant.mutateAsync({ id: props.restaurant._id, ...output, images })
            }
            reset(form)
            setImages([])
            props.onSuccess()
        } catch (error) {
            console.error(`Error ${props.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    return (
        <Form of={form} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
                                {friends?.map((f) => (
                                    <option key={f.name} value={f.name}>
                                        {f.name}
                                    </option>
                                ))}
                            </Select>
                        </FieldWrapper>
                    )}
                </Field>
            </div>
            {props.mode === "edit" && (
                <Field of={form} path={["rating"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Rating
                            </label>
                            <div className="mt-2">
                                <EmojiRating
                                    rating={typeof field.input === "number" && field.input >= 1 ? field.input : null}
                                    onRate={(rating) => setInput(form, { path: ["rating"], input: rating })}
                                />
                            </div>
                        </FieldWrapper>
                    )}
                </Field>
            )}
            <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                {...(props.mode === "edit"
                    ? { restaurantId: props.restaurant._id }
                    : { onRemove: (storageId) => setPendingRemovedStorageIds((prev) => [...prev, storageId]) })}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button type="submit">{props.mode === "add" ? "Add Restaurant" : "Save Changes"}</Button>
            </div>
        </Form>
    )
}
