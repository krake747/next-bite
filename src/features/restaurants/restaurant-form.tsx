import { useForm, Field, Form, reset, setInput, useField } from "@formisch/react"
import { useState } from "react"

import {
    useAddRestaurantWithHours,
    useUpdateRestaurant,
    useFriends,
    useCleanupStorage,
    type ImageRecord,
    type Restaurant,
} from "@core/hooks"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { EmojiRating } from "@pattern/emoji-rating"
import { ImageUpload } from "@pattern/image-upload"
import { PlacesAutocomplete } from "@pattern/places-autocomplete"
import { Button } from "@ui/button"
import { FieldWrapper, Input, Textarea, Select } from "@ui/field"

export type RestaurantFormProps =
    | { mode: "add"; onSuccess: () => void; onCancel: () => void }
    | { mode: "edit"; restaurant: Restaurant; onSuccess: () => void; onCancel: () => void }

type StripUndefined<T extends Record<string, unknown>> = {
    [K in keyof T as undefined extends T[K] ? K : never]+?: Exclude<T[K], undefined>
} & {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

function stripUndefined<T extends Record<string, unknown>>(output: T): StripUndefined<T> {
    const stripped = Object.fromEntries(Object.entries(output).filter(([, field]) => field !== undefined))
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- entries are filtered to defined values, matching the type
    return stripped as StripUndefined<T>
}

export function RestaurantForm(props: Readonly<RestaurantFormProps>) {
    const addRestaurantWithHours = useAddRestaurantWithHours()
    const updateRestaurant = useUpdateRestaurant()
    const friends = useFriends()
    const cleanupStorage = useCleanupStorage()

    const initialImages = props.mode === "edit" ? [...(props.restaurant.images ?? [])] : []
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
    const nameField = useField(form, { path: ["name"] })
    const cuisineField = useField(form, { path: ["cuisine"] })
    const locationField = useField(form, { path: ["location"] })
    const notesField = useField(form, { path: ["notes"] })
    const linkField = useField(form, { path: ["link"] })
    const addedByField = useField(form, { path: ["addedBy"] })
    const ratingField = useField(form, { path: ["rating"] })

    const cleanupStorageIds = async (storageIds: ReadonlyArray<string>) => {
        for (const storageId of storageIds) {
            try {
                await cleanupStorage.mutateAsync({ storageId })
            } catch {}
        }
    }

    const cleanupImages = async () => {
        if (props.mode === "add") {
            await cleanupStorageIds(images.map((img) => img.storageId))
            await cleanupStorageIds(pendingRemovedStorageIds)
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
        if (lat !== null && lng !== null) {
            setInput(form, { path: ["lat"], input: lat })
            setInput(form, { path: ["lng"], input: lng })
        } else {
            setInput(form, { path: ["lat"], input: undefined })
            setInput(form, { path: ["lng"], input: undefined })
        }
    }

    const handleSubmit = async (output: Readonly<Omit<RestaurantOutput, "images">>) => {
        try {
            if (props.mode === "add") {
                await addRestaurantWithHours.mutateAsync({ ...stripUndefined(output), images })
                await cleanupStorageIds(pendingRemovedStorageIds)
                setPendingRemovedStorageIds([])
            } else {
                await updateRestaurant.mutateAsync({ id: props.restaurant._id, ...stripUndefined(output), images })
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
                    {() => (
                        <FieldWrapper errors={nameField.errors}>
                            <Input
                                input={nameField.input}
                                errors={nameField.errors}
                                label="Restaurant name"
                                placeholder="The fancy burger place"
                                {...nameField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["cuisine"]}>
                    {() => (
                        <FieldWrapper errors={cuisineField.errors}>
                            <Input
                                input={cuisineField.input}
                                errors={cuisineField.errors}
                                label="Cuisine"
                                placeholder="Burgers, Italian, etc."
                                {...cuisineField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
            </div>
            <Field of={form} path={["location"]}>
                {() => (
                    <FieldWrapper errors={locationField.errors}>
                        <PlacesAutocomplete
                            value={locationField.input ?? ""}
                            onChange={handleLocationChange}
                            label="Location"
                            placeholder="Search for a restaurant..."
                        />
                    </FieldWrapper>
                )}
            </Field>
            <Field of={form} path={["notes"]}>
                {() => (
                    <FieldWrapper errors={notesField.errors}>
                        <Textarea
                            input={notesField.input}
                            errors={notesField.errors}
                            label="Notes"
                            placeholder="What to order..."
                            rows={3}
                            {...notesField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
                <Field of={form} path={["link"]}>
                    {() => (
                        <FieldWrapper errors={linkField.errors}>
                            <Input
                                input={linkField.input}
                                errors={linkField.errors}
                                type="url"
                                label="Menu link"
                                placeholder="https://menu.com/..."
                                {...linkField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["addedBy"]}>
                    {() => (
                        <FieldWrapper errors={addedByField.errors}>
                            <Select
                                input={addedByField.input}
                                errors={addedByField.errors}
                                label="Added by"
                                options={[
                                    { value: "", label: "Select friend" },
                                    ...(friends ?? []).map((f: Readonly<{ name: string }>) => ({
                                        value: f.name,
                                        label: f.name,
                                    })),
                                ]}
                                {...addedByField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
            </div>
            {props.mode === "edit" && (
                <Field of={form} path={["rating"]}>
                    {() => (
                        <FieldWrapper errors={ratingField.errors}>
                            <label className="block text-sm font-medium text-stone-700">Rating</label>
                            <div className="mt-2">
                                <EmojiRating
                                    rating={
                                        typeof ratingField.input === "number" && ratingField.input >= 1
                                            ? ratingField.input
                                            : null
                                    }
                                    onRate={(rating) => {
                                        setInput(form, { path: ["rating"], input: rating })
                                    }}
                                    {...addedByField.props}
                                />
                            </div>
                        </FieldWrapper>
                    )}
                </Field>
            )}
            <ImageUpload
                images={images}
                onImagesChange={(updated) => {
                    setImages([...updated])
                }}
                maxImages={5}
                {...(props.mode === "edit"
                    ? { restaurantId: props.restaurant._id }
                    : {
                          onRemove: (storageId: string) => {
                              setPendingRemovedStorageIds((prev: ReadonlyArray<string>) => [...prev, storageId])
                          },
                      })}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        void handleClose()
                    }}
                >
                    Cancel
                </Button>
                <Button type="submit">{props.mode === "add" ? "Add Restaurant" : "Save Changes"}</Button>
            </div>
        </Form>
    )
}
