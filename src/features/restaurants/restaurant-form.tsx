import { Form, reset, setInput, useField, useForm, type FormStore } from "@formisch/react"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { SyncTimeoutError, type RestaurantAddArgs, type RestaurantUpdateArgs } from "@api/db/restaurants"
import { useAddRestaurantWithHours, useCleanupStorage, useUpdateRestaurant, type Restaurant } from "@core/restaurants"
import { RestaurantSchema, type RestaurantOutput } from "@core/schemas"
import { ImageUpload } from "@pattern/image-upload"
import { type PlaceSelection } from "@pattern/places-autocomplete"
import { Button } from "@ui/button"

import { suggestCuisine } from "./cuisine-suggestion"
import { LinkField, LocationSection, NameCuisineFields, NotesSection, RatingSection } from "./restaurant-form-fields"
import { useRestaurantImages, type GalleryDraft } from "./use-restaurant-images"

export type RestaurantFormProps =
    | {
          mode: "add"
          initial?: Readonly<{
              name: string
              cuisine: string
              location: string
              lat?: number | undefined
              lng?: number | undefined
              placeId?: string | undefined
          }>
          onSuccess: (restaurantId: Id<"restaurants">) => void
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

type SubmitPhase =
    | { kind: "editing" }
    | { kind: "saving" }
    | { kind: "uncertain"; message: string }
    | { kind: "failed"; message: string }
    | { kind: "committed" }

function toFailedPhase(error: unknown): Extract<SubmitPhase, { kind: "uncertain" } | { kind: "failed" }> {
    if (SyncTimeoutError.is(error)) {
        return {
            kind: "uncertain",
            message:
                "Saving is taking longer than expected. It may already be saved. Retry is safe and will not create a duplicate.",
        }
    }
    return { kind: "failed", message: error instanceof Error ? error.message : "Saving failed." }
}

function SubmitButton({ mode, saving }: Readonly<{ mode: "add" | "edit"; saving: boolean }>) {
    return (
        <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "add" ? "Add Restaurant" : "Save Changes"}
        </Button>
    )
}

// Owns the form's discard handshake from the outside: every exit path
// (Cancel, success, switching drafts) runs the registered discard first so
// staged uploads never strand, then continues. The noop default covers exits
// before the form has mounted and registered.
export function useFormDiscard(): {
    registerDiscard: (discard: () => Promise<void>) => void
    discard: () => Promise<void>
} {
    const discardRef = useRef<() => Promise<void>>(async () => {})
    return {
        registerDiscard: (discard) => {
            discardRef.current = discard
        },
        discard: async () => discardRef.current(),
    }
}

function useSubmitDiscard(args: {
    onDiscardReady: (discard: () => Promise<void>) => void
    gallery: Pick<GalleryDraft, "discardChanges">
    resetForm: () => void
    phaseRef: { readonly current: SubmitPhase }
}): void {
    const { onDiscardReady, gallery, resetForm, phaseRef } = args
    useEffect(() => {
        onDiscardReady(async () => {
            // A committed submit handed its images to persisted ownership. A
            // saving or uncertain submit may still commit with these images
            // attached. None of those states may clean: reset the local draft
            // and leave stored files for the backend either way. Read through
            // the ref: discard fires synchronously inside the submit close
            // path, before the phase state commit re-renders.
            const phase = phaseRef.current
            if (phase.kind === "saving" || phase.kind === "uncertain" || phase.kind === "committed") {
                resetForm()
                return
            }
            await gallery.discardChanges()
            resetForm()
        })
    }, [onDiscardReady, gallery, resetForm, phaseRef])
}

function SubmitPhaseBanner({ phase, onRetry }: Readonly<{ phase: SubmitPhase; onRetry: () => void }>) {
    if (phase.kind !== "uncertain" && phase.kind !== "failed") {
        return null
    }
    return (
        <div role={phase.kind === "failed" ? "alert" : "status"} className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">{phase.message}</p>
            {phase.kind === "uncertain" && (
                <Button type="button" tone="secondary" onClick={onRetry}>
                    Retry safely
                </Button>
            )}
        </div>
    )
}

async function submitNewRestaurant(input: {
    add: (args: RestaurantAddArgs) => Promise<Id<"restaurants">>
    gallery: Pick<GalleryDraft, "images">
    output: Readonly<Omit<RestaurantOutput, "images">>
    clientMutationId: string
}): Promise<Id<"restaurants">> {
    const { location, lat, lng, placeId, ...rest } = stripUndefined(input.output)
    const coords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined
    return input.add({
        ...rest,
        addressLabel: location,
        ...(coords !== undefined ? { coords } : {}),
        ...(placeId !== undefined ? { placeId } : {}),
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
    onSuccess: (restaurantId: Id<"restaurants"> | undefined) => void
    add: (input: RestaurantAddArgs) => Promise<Id<"restaurants">>
    update: (input: RestaurantUpdateArgs) => Promise<unknown>
}): {
    submitPhase: SubmitPhase
    handleSubmit: (output: RestaurantFormOutput) => Promise<void>
    handleRetry: () => void
} {
    // One mutation identity per draft: the key is minted when the form mounts
    // and only rotates after a committed submit, so a timed-out submit retries
    // on the same key instead of duplicating the restaurant. A fresh mount is
    // a new draft with a new identity.
    const [clientMutationId, setClientMutationId] = useState(() => crypto.randomUUID())
    // One shape, two clocks: state renders the banner and button, while the ref
    // serves the synchronous discard read inside the submit close path (state
    // commits after close fires). The single setter below keeps them together.
    const [submitPhase, setSubmitPhaseState] = useState<SubmitPhase>({ kind: "editing" })
    const phaseRef = useRef<SubmitPhase>(submitPhase)
    const setSubmitPhase = (phase: SubmitPhase) => {
        phaseRef.current = phase
        setSubmitPhaseState(phase)
    }
    const lastOutputRef = useRef<RestaurantFormOutput | null>(null)

    useSubmitDiscard({
        onDiscardReady: args.onDiscardReady,
        gallery: args.gallery,
        resetForm: args.resetForm,
        phaseRef,
    })

    const handleSubmit = async (output: RestaurantFormOutput) => {
        lastOutputRef.current = output
        setSubmitPhase({ kind: "saving" })
        try {
            const createdId =
                args.target.mode === "add"
                    ? await submitNewRestaurant({
                          add: args.add,
                          gallery: args.gallery,
                          output,
                          clientMutationId,
                      })
                    : undefined
            if (args.target.mode === "edit") {
                await submitExistingRestaurant({
                    update: args.update,
                    gallery: args.gallery,
                    output,
                    restaurantId: args.target.restaurantId,
                })
            }
            await args.gallery.commitSubmit()
            args.resetForm()
            setSubmitPhase({ kind: "committed" })
            setClientMutationId(crypto.randomUUID())
            args.onSuccess(createdId)
        } catch (error) {
            setSubmitPhase(toFailedPhase(error))
            console.error(`Error ${args.target.mode === "add" ? "adding" : "updating"} restaurant:`, error)
        }
    }

    const handleRetry = () => {
        const output = lastOutputRef.current
        if (output !== null) {
            void handleSubmit(output)
        }
    }

    return { submitPhase, handleSubmit, handleRetry }
}

type RestaurantFormStore = FormStore<typeof RestaurantSchema>

function successFor(props: Readonly<RestaurantFormProps>): (restaurantId: Id<"restaurants"> | undefined) => void {
    return (restaurantId) => {
        if (props.mode === "add") {
            if (restaurantId !== undefined) {
                props.onSuccess(restaurantId)
            }
        } else {
            props.onSuccess()
        }
    }
}

function applyPlaceSelection(
    form: RestaurantFormStore,
    selection: PlaceSelection,
    nameInput: string | undefined,
    cuisineInput: string | undefined,
): void {
    setInput(form, { path: ["location"], input: selection.address })
    if (selection.lat !== undefined && selection.lng !== undefined) {
        setInput(form, { path: ["lat"], input: selection.lat })
        setInput(form, { path: ["lng"], input: selection.lng })
    } else {
        setInput(form, { path: ["lat"], input: undefined })
        setInput(form, { path: ["lng"], input: undefined })
    }
    setInput(form, { path: ["placeId"], input: selection.placeId })
    // Prefill only what the user has not typed yet; a pick never
    // overwrites manual input.
    if ((nameInput ?? "") === "" && selection.name !== undefined && selection.name !== "") {
        setInput(form, { path: ["name"], input: selection.name })
    }
    if ((cuisineInput ?? "") === "") {
        const suggested = suggestCuisine(selection.primaryType)
        if (suggested !== undefined) {
            setInput(form, { path: ["cuisine"], input: suggested })
        }
    }
}

function initialInputFor(props: Readonly<RestaurantFormProps>) {
    return props.mode === "edit"
        ? {
              name: props.restaurant.name,
              cuisine: props.restaurant.cuisine,
              location: props.restaurant.address.label,
              lat: props.restaurant.address.enrichment?.coords?.lat,
              lng: props.restaurant.address.enrichment?.coords?.lng,
              notes: props.restaurant.details?.notes ?? "",
              link: props.restaurant.details?.link ?? "",
              rating: props.restaurant.rating,
          }
        : props.initial !== undefined
          ? { ...props.initial }
          : undefined
}

function FormActions({
    mode,
    saving,
    onCancel,
}: Readonly<{ mode: "add" | "edit"; saving: boolean; onCancel: () => void }>) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" tone="secondary" onClick={onCancel}>
                Cancel
            </Button>
            <SubmitButton mode={mode} saving={saving} />
        </div>
    )
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

    const initialInput = initialInputFor(props)
    const form = useForm({
        schema: RestaurantSchema,
        ...(initialInput !== undefined ? { initialInput } : {}),
    })
    const nameField = useField(form, { path: ["name"] })
    const cuisineField = useField(form, { path: ["cuisine"] })

    const submit = useSubmitDraft({
        target: props.mode === "add" ? { mode: "add" } : { mode: "edit", restaurantId: props.restaurant._id },
        gallery,
        resetForm: () => {
            reset(form)
        },
        onDiscardReady: props.onDiscardReady,
        onSuccess: successFor(props),
        add: addRestaurantWithHours.mutateAsync,
        update: updateRestaurant.mutateAsync,
    })

    const handleLocationChange = (selection: PlaceSelection) => {
        applyPlaceSelection(form, selection, nameField.input, cuisineField.input)
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
            <FormActions
                mode={props.mode}
                saving={submit.submitPhase.kind === "saving"}
                onCancel={() => {
                    props.onCancel()
                }}
            />
            <SubmitPhaseBanner phase={submit.submitPhase} onRetry={submit.handleRetry} />
        </Form>
    )
}
