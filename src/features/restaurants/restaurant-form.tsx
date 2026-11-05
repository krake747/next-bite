import { Form, reset, setInput, useForm } from "@formisch/react"

import { useAddRestaurantWithHours, useUpdateRestaurant, type Restaurant } from "@core/hooks"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { ImageUpload } from "@pattern/image-upload"
import { Button } from "@ui/button"

import {
    LinkAddedByFields,
    LocationSection,
    NameCuisineFields,
    NotesSection,
    RatingSection,
} from "./restaurant-form-fields"
import { useRestaurantImages } from "./use-restaurant-images"

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
    const gallery = useRestaurantImages(props.mode, props.mode === "edit" ? (props.restaurant.images ?? []) : [])

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

    const handleClose = async () => {
        await gallery.discardChanges()
        reset(form)
        props.onCancel()
    }

    const handleLocationChange = (address: string, lat?: number, lng?: number) => {
        setInput(form, { path: ["location"], input: address })
        if (lat !== undefined && lng !== undefined) {
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
                await addRestaurantWithHours.mutateAsync({ ...stripUndefined(output), images: gallery.images })
                await gallery.completeAddSubmit()
            } else {
                await updateRestaurant.mutateAsync({
                    id: props.restaurant._id,
                    ...stripUndefined(output),
                    images: gallery.images,
                })
            }
            reset(form)
            gallery.resetImages()
            props.onSuccess()
        } catch (error) {
            console.error(`Error ${props.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    return (
        <Form of={form} onSubmit={handleSubmit} className="space-y-4">
            <NameCuisineFields form={form} />
            <LocationSection form={form} onLocationChange={handleLocationChange} />
            <NotesSection form={form} />
            <LinkAddedByFields form={form} />
            {props.mode === "edit" && <RatingSection form={form} />}
            <ImageUpload
                images={gallery.images}
                onImagesChange={(updated) => {
                    gallery.setImages([...updated])
                }}
                maxImages={5}
                {...(props.mode === "edit"
                    ? { restaurantId: props.restaurant._id }
                    : { onRemove: gallery.trackRemoved })}
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
