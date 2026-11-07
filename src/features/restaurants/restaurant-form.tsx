import { Form, reset, setInput, useForm } from "@formisch/react"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { SyncTimeoutError, type RestaurantAddArgs, type RestaurantUpdateArgs } from "@core/db/restaurants"
import { useAddRestaurantWithHours, useCleanupStorage, useUpdateRestaurant, type Restaurant } from "@core/hooks"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { ImageUpload } from "@pattern/image-upload"
import { Button } from "@ui/button"

import { LinkField, LocationSection, NameCuisineFields, NotesSection, RatingSection } from "./restaurant-form-fields"
import { useRestaurantImages, type GalleryDraft } from "./use-restaurant-images"

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

type SubmitOutcome = { kind: "idle" } | { kind: "uncertain"; message: string } | { kind: "failed"; message: string }

function toSubmitOutcome(error: unknown): Exclude<SubmitOutcome, { kind: "idle" }> {
    if (SyncTimeoutError.is(error)) {
        return {
            kind: "uncertain",
            message:
                "Saving is taking longer than expected. It may already be saved. Retry is safe and will not create a duplicate.",
        }
    }
    return { kind: "failed", message: error instanceof Error ? error.message : "Saving failed." }
}

type SubmitGuard = {
    submitted: boolean
    uncertain: boolean
    pending: boolean
}

function SubmitButton({ mode, saving }: Readonly<{ mode: "add" | "edit"; saving: boolean }>) {
    return (
        <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "add" ? "Add Restaurant" : "Save Changes"}
        </Button>
    )
}

function useSubmitDiscard(args: {
    onDiscardReady: (discard: () => Promise<void>) => void
    gallery: Pick<GalleryDraft, "discardChanges">
    resetForm: () => void
    guardRef: { current: SubmitGuard }
}): void {
    const { onDiscardReady, gallery, resetForm, guardRef } = args
    useEffect(() => {
        onDiscardReady(async () => {
            // A committed submit handed its images to persisted ownership. A
            // pending or uncertain submit may still commit with these images
            // attached. None of those states may clean: reset the local draft
            // and leave stored files for the backend either way.
            const guard = guardRef.current
            if (guard.submitted || guard.uncertain || guard.pending) {
                resetForm()
                return
            }
            await gallery.discardChanges()
            resetForm()
        })
    }, [onDiscardReady, gallery, resetForm, guardRef])
}

function SubmitOutcomeBanner({ outcome, onRetry }: Readonly<{ outcome: SubmitOutcome; onRetry: () => void }>) {
    if (outcome.kind === "idle") {
        return null
    }
    return (
        <div role={outcome.kind === "failed" ? "alert" : "status"} className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">{outcome.message}</p>
            {outcome.kind === "uncertain" && (
                <Button type="button" tone="secondary" onClick={onRetry}>
                    Retry safely
                </Button>
            )}
        </div>
    )
}

async function submitNewRestaurant(input: {
    add: (args: RestaurantAddArgs) => Promise<unknown>
    gallery: Pick<GalleryDraft, "images">
    output: Readonly<Omit<RestaurantOutput, "images" | "placeId">>
    clientMutationId: string
}): Promise<void> {
    const { location, lat, lng, ...rest } = stripUndefined(input.output)
    const coords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined
    await input.add({
        ...rest,
        addressLabel: location,
        ...(coords !== undefined ? { coords } : {}),
        images: input.gallery.images,
        clientMutationId: input.clientMutationId,
    })
}

async function submitExistingRestaurant(input: {
    update: (args: RestaurantUpdateArgs) => Promise<unknown>
    gallery: Pick<GalleryDraft, "images">
    output: Readonly<Omit<RestaurantOutput, "images" | "placeId">>
    restaurantId: Id<"restaurants">
}): Promise<void> {
    const { location, lat, lng, ...rest } = stripUndefined(input.output)
    const coords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined
    await input.update({
        id: input.restaurantId,
        ...rest,
        addressLabel: location,
        ...(coords !== undefined ? { coords } : {}),
        images: input.gallery.images,
    })
}

type RestaurantFormOutput = Readonly<Omit<RestaurantOutput, "images" | "placeId">>

function useSubmitDraft(args: {
    target: { mode: "add" } | { mode: "edit"; restaurantId: Id<"restaurants"> }
    gallery: GalleryDraft
    resetForm: () => void
    onDiscardReady: (discard: () => Promise<void>) => void
    onSuccess: () => void
    add: (input: RestaurantAddArgs) => Promise<unknown>
    update: (input: RestaurantUpdateArgs) => Promise<unknown>
}): {
    submitOutcome: SubmitOutcome
    isSaving: boolean
    handleSubmit: (output: RestaurantFormOutput) => Promise<void>
    handleRetry: () => void
} {
    // One mutation identity per draft: the key is minted when the form mounts
    // and only rotates after a committed submit, so a timed-out submit retries
    // on the same key instead of duplicating the restaurant. A fresh mount is
    // a new draft with a new identity.
    const [clientMutationId, setClientMutationId] = useState(() => crypto.randomUUID())
    const [submitOutcome, setSubmitOutcome] = useState<SubmitOutcome>({ kind: "idle" })
    const [isSaving, setIsSaving] = useState(false)
    const guardRef = useRef<SubmitGuard>({ submitted: false, uncertain: false, pending: false })
    const lastOutputRef = useRef<RestaurantFormOutput | null>(null)

    useSubmitDiscard({
        onDiscardReady: args.onDiscardReady,
        gallery: args.gallery,
        resetForm: args.resetForm,
        guardRef,
    })

    const handleSubmit = async (output: RestaurantFormOutput) => {
        lastOutputRef.current = output
        const guard = guardRef.current
        guard.submitted = false
        guard.uncertain = false
        guard.pending = true
        setIsSaving(true)
        setSubmitOutcome({ kind: "idle" })
        try {
            if (args.target.mode === "add") {
                await submitNewRestaurant({
                    add: args.add,
                    gallery: args.gallery,
                    output,
                    clientMutationId,
                })
            } else {
                await submitExistingRestaurant({
                    update: args.update,
                    gallery: args.gallery,
                    output,
                    restaurantId: args.target.restaurantId,
                })
            }
            await args.gallery.commitSubmit()
            args.resetForm()
            guard.submitted = true
            guard.pending = false
            setIsSaving(false)
            setClientMutationId(crypto.randomUUID())
            args.onSuccess()
        } catch (error) {
            guard.pending = false
            setIsSaving(false)
            if (SyncTimeoutError.is(error)) {
                guard.uncertain = true
            }
            setSubmitOutcome(toSubmitOutcome(error))
            console.error(`Error ${args.target.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    const handleRetry = () => {
        const output = lastOutputRef.current
        if (output !== null) {
            void handleSubmit(output)
        }
    }

    return { submitOutcome, isSaving, handleSubmit, handleRetry }
}

export function RestaurantForm(props: Readonly<RestaurantFormProps>) {
    const addRestaurantWithHours = useAddRestaurantWithHours()
    const updateRestaurant = useUpdateRestaurant()
    const cleanupStorage = useCleanupStorage()
    const gallery = useRestaurantImages(props.mode === "edit" ? props.restaurant.images : [], {
        mode: props.mode,
        cleanup: async (args) => {
            await cleanupStorage.mutateAsync(args)
        },
    })

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

    const submit = useSubmitDraft({
        target: props.mode === "add" ? { mode: "add" } : { mode: "edit", restaurantId: props.restaurant._id },
        gallery,
        resetForm: () => {
            reset(form)
        },
        onDiscardReady: props.onDiscardReady,
        onSuccess: props.onSuccess,
        add: addRestaurantWithHours.mutateAsync,
        update: updateRestaurant.mutateAsync,
    })

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

    return (
        <Form of={form} onSubmit={submit.handleSubmit} className="space-y-4">
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
                {...(props.mode === "edit" ? { restaurantId: props.restaurant._id } : {})}
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
                <SubmitButton mode={props.mode} saving={submit.isSaving} />
            </div>
            <SubmitOutcomeBanner outcome={submit.submitOutcome} onRetry={submit.handleRetry} />
        </Form>
    )
}
