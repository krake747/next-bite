import { Form, reset, setInput, useField, useForm, type FormStore } from "@formisch/react"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { SyncTimeoutError, type PlaceCreateArgs } from "@api/db/restaurants"
import { useAddPlace, useDeleteUpload, useUploadImage } from "@core/restaurants"
import { RestaurantSchema, type ImageRecord, type RestaurantOutput } from "@core/schemas"
import { ImageUpload } from "@pattern/image-upload"
import { type PlaceSelection } from "@pattern/places-autocomplete"
import { Button } from "@ui/button"

import { suggestCuisine } from "./cuisine-suggestion"
import { LinkField, LocationSection, NameCuisineFields, NotesSection } from "./restaurant-form-fields"
import { useRestaurantImages, type GalleryDraft } from "./use-restaurant-images"

export type AddRestaurantFormProps = Readonly<{
    initial?: Readonly<{
        name: string
        cuisine: string
        location: string
        placeId?: string | undefined
    }>
    onSuccess: (placeId: string) => void
    onCancel: () => void
    onDiscardReady: (discard: () => Promise<void>) => void
}>

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

// See ADR-0015: every exit runs discard first so staged uploads never strand.
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
            // Committed or uncertain submits keep files with the backend; reset draft only.
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

type RestaurantFormOutput = Readonly<RestaurantOutput>

function toCreateArgs(
    output: RestaurantFormOutput,
    gallery: Pick<GalleryDraft, "images">,
    clientMutationId: string,
): PlaceCreateArgs {
    const { location, placeId, notes, link, cuisine, ...rest } = output
    const google = placeId !== undefined ? { placeId } : undefined
    return {
        name: rest.name,
        ...(cuisine !== undefined && cuisine !== "" ? { cuisine } : {}),
        addressLabel: location,
        ...(google !== undefined ? { google } : {}),
        ...(notes !== undefined && notes !== "" ? { note: notes } : {}),
        ...(link !== undefined && link !== "" ? { link } : {}),
        photos: gallery.images.map((image) => ({
            storageId: image.storageId,
            ...(image.width !== undefined ? { width: image.width } : {}),
            ...(image.height !== undefined ? { height: image.height } : {}),
        })),
        clientMutationId,
    }
}

function useSubmitDraft(args: {
    gallery: GalleryDraft
    resetForm: () => void
    onDiscardReady: (discard: () => Promise<void>) => void
    onSuccess: (placeId: Id<"places">) => void
    add: (input: PlaceCreateArgs & { readonly previews: ReadonlyArray<ImageRecord> }) => Promise<Id<"places">>
}): {
    submitPhase: SubmitPhase
    handleSubmit: (output: RestaurantFormOutput) => Promise<void>
    handleRetry: () => void
} {
    // See ADR-0002: one key per draft, retries reuse the same key.
    const [clientMutationId, setClientMutationId] = useState(() => crypto.randomUUID())
    // State renders; ref serves the synchronous discard read.
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
            const placeId = await args.add({
                ...toCreateArgs(output, args.gallery, clientMutationId),
                previews: args.gallery.images,
            })
            await args.gallery.commitSubmit()
            args.resetForm()
            setSubmitPhase({ kind: "committed" })
            setClientMutationId(crypto.randomUUID())
            args.onSuccess(placeId)
        } catch (error) {
            setSubmitPhase(toFailedPhase(error))
            if (!SyncTimeoutError.is(error)) {
                console.error("Error adding restaurant:", error)
            }
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

function applyPlaceSelection(
    form: RestaurantFormStore,
    selection: PlaceSelection,
    nameInput: string | undefined,
    cuisineInput: string | undefined,
): void {
    setInput(form, { path: ["location"], input: selection.address })
    setInput(form, { path: ["placeId"], input: selection.placeId })
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

function initialInputFor(props: AddRestaurantFormProps) {
    return props.initial !== undefined ? { ...props.initial } : undefined
}

export function RestaurantForm(props: AddRestaurantFormProps) {
    const addPlace = useAddPlace()
    const uploadImage = useUploadImage()
    const deleteUpload = useDeleteUpload()
    const gallery = useRestaurantImages({
        cleanup: async (args) => {
            await deleteUpload.mutateAsync(args)
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
        gallery,
        resetForm: () => {
            reset(form)
        },
        onDiscardReady: props.onDiscardReady,
        onSuccess: props.onSuccess,
        add: addPlace.mutateAsync,
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
            <ImageUpload
                images={gallery.images}
                onImagesChange={(updated) => {
                    gallery.setImages([...updated])
                }}
                uploadImage={uploadImage}
                deleteUpload={async (args) => deleteUpload.mutateAsync(args)}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" tone="secondary" onClick={props.onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submit.submitPhase.kind === "saving"}>
                    {submit.submitPhase.kind === "saving" ? "Saving…" : "Add Restaurant"}
                </Button>
            </div>
            <SubmitPhaseBanner phase={submit.submitPhase} onRetry={submit.handleRetry} />
        </Form>
    )
}
