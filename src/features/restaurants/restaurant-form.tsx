import { Form, reset, setInput, useForm } from "@formisch/react"
import { useEffect, useRef, useState } from "react"

import { SyncTimeoutError } from "@core/db/restaurants"
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
    // One mutation identity per draft: the key is minted when the form mounts
    // and only rotates after a committed submit, so a timed-out submit retries
    // on the same key instead of duplicating the restaurant. A fresh mount is
    // a new draft with a new identity.
    const [clientMutationId, setClientMutationId] = useState(() => crypto.randomUUID())
    const [submitOutcome, setSubmitOutcome] = useState<
        { kind: "idle" } | { kind: "uncertain"; message: string } | { kind: "failed"; message: string }
    >({ kind: "idle" })
    const uncertainSubmitRef = useRef(false)
    const submittedRef = useRef(false)
    const pendingSubmitRef = useRef(false)
    const [isSaving, setIsSaving] = useState(false)
    const lastOutputRef = useRef<Readonly<Omit<RestaurantOutput, "images" | "placeId">> | null>(null)

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
            // A committed submit handed its images to persisted ownership. A
            // pending or uncertain submit may still commit with these images
            // attached. None of those states may clean: reset the local draft
            // and leave stored files for the backend either way.
            if (submittedRef.current || uncertainSubmitRef.current || pendingSubmitRef.current) {
                reset(form)
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
        lastOutputRef.current = output
        const coords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined
        submittedRef.current = false
        uncertainSubmitRef.current = false
        pendingSubmitRef.current = true
        setIsSaving(true)
        setSubmitOutcome({ kind: "idle" })
        try {
            if (props.mode === "add") {
                await addRestaurantWithHours.mutateAsync({
                    ...rest,
                    addressLabel: location,
                    ...(coords !== undefined ? { coords } : {}),
                    images: gallery.images,
                    clientMutationId,
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
            pendingSubmitRef.current = false
            setIsSaving(false)
            setClientMutationId(crypto.randomUUID())
            props.onSuccess()
        } catch (error) {
            pendingSubmitRef.current = false
            setIsSaving(false)
            if (error instanceof SyncTimeoutError) {
                uncertainSubmitRef.current = true
                setSubmitOutcome({
                    kind: "uncertain",
                    message:
                        "Saving is taking longer than expected. It may already be saved. Retry is safe and will not create a duplicate.",
                })
            } else {
                setSubmitOutcome({
                    kind: "failed",
                    message: error instanceof Error ? error.message : "Saving failed.",
                })
            }
            console.error(`Error ${props.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    const handleRetry = () => {
        const output = lastOutputRef.current
        if (output !== null) {
            void handleSubmit(output)
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
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving…" : props.mode === "add" ? "Add Restaurant" : "Save Changes"}
                </Button>
            </div>
            {submitOutcome.kind !== "idle" && (
                <div role={submitOutcome.kind === "failed" ? "alert" : "status"} className="space-y-2 pt-2">
                    <p className="text-sm text-stone-600">{submitOutcome.message}</p>
                    {submitOutcome.kind === "uncertain" && (
                        <Button type="button" tone="secondary" onClick={handleRetry}>
                            Retry safely
                        </Button>
                    )}
                </div>
            )}
        </Form>
    )
}
