import { Form, reset, setInput, useForm } from "@formisch/react"
import { useEffect, useRef } from "react"

import { useAddRestaurantWithHours, useUpdateRestaurant, type Restaurant } from "@core/hooks"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { ImageUpload } from "@pattern/image-upload"
import { Button } from "@ui/button"

import { LinkField, LocationSection, NameCuisineFields, NotesSection, RatingSection } from "./restaurant-form-fields"
import { useRestaurantImages } from "./use-restaurant-images"

export type RestaurantFormProps =
    | {
          mode: "add"
          onSuccess: () => void
          onCancel: () => void
          onDiscardReady: (discard: () => Promise<void>) => void
      }
    | {
          mode: "edit"
          restaurant: Restaurant
          onSuccess: () => void
          onCancel: () => void
          onDiscardReady: (discard: () => Promise<void>) => void
      }

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
    const gallery = useRestaurantImages(props.mode === "edit" ? props.restaurant.images : [], {
        discardShouldCleanup: props.mode === "add",
    })
    const submittedRef = useRef(false)

    const form = useForm({
        schema: RestaurantSchema,
        ...(props.mode === "edit"
            ? {
                  initialInput: {
                      name: props.restaurant.name,
                      cuisine: props.restaurant.cuisine,
                      location: props.restaurant.address.label,
                      lat: props.restaurant.address.enrichment?.coords?.lat,
                      lng: props.restaurant.address.enrichment?.coords?.lng,
                      notes: props.restaurant.details?.notes ?? "",
                      link: props.restaurant.details?.link ?? "",
                      rating: props.restaurant.rating,
                  },
              }
            : {}),
    })

    useEffect(() => {
        props.onDiscardReady(async () => {
            // A submitted draft already handed its images to persisted
            // ownership. Discarding afterwards must never remove them, no
            // matter when the close runs relative to the submit.
            if (submittedRef.current) {
                return
            }
            await gallery.discardChanges()
            reset(form)
        })
    }, [props.onDiscardReady, gallery, form])

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

    const handleSubmit = async (output: Readonly<Omit<RestaurantOutput, "images" | "placeId">>) => {
        const { location, lat, lng, ...rest } = stripUndefined(output)
        const coords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined
        try {
            if (props.mode === "add") {
                await addRestaurantWithHours.mutateAsync({
                    ...rest,
                    addressLabel: location,
                    ...(coords !== undefined ? { coords } : {}),
                    images: gallery.images,
                })
                await gallery.completeAddSubmit()
            } else {
                await updateRestaurant.mutateAsync({
                    id: props.restaurant._id,
                    ...rest,
                    addressLabel: location,
                    ...(coords !== undefined ? { coords } : {}),
                    images: gallery.images,
                })
            }
            reset(form)
            gallery.resetImages()
            submittedRef.current = true
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
            <LinkField form={form} />
            {props.mode === "edit" && <RatingSection form={form} />}
            <ImageUpload
                images={gallery.images}
                onImagesChange={(updated) => {
                    gallery.setImages([...updated])
                }}
                {...(props.mode === "edit"
                    ? { restaurantId: props.restaurant._id }
                    : { onRemove: gallery.trackRemoved })}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button
                    type="button"
                    tone="secondary"
                    onClick={() => {
                        props.onCancel()
                    }}
                >
                    Cancel
                </Button>
                <Button type="submit">{props.mode === "add" ? "Add Restaurant" : "Save Changes"}</Button>
            </div>
        </Form>
    )
}
