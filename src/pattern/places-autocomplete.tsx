import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useEffect, useId, useRef, useState } from "react"
import * as v from "valibot"

import { cx } from "@ui/cva.config"
import { control, fieldLabel } from "@ui/variants"

import { GoogleAttribution } from "./google-attribution"

type Bias = Readonly<{ north: number; south: number; east: number; west: number }>

export type PlaceSelection = {
    readonly address: string
    readonly name?: string | undefined
    readonly placeId?: string | undefined
    readonly primaryType?: string | undefined
}

type PlacesAutocompleteProps = {
    value: string
    onChange: (selection: PlaceSelection) => void
    placeholder?: string | undefined
    label?: string | undefined
    className?: string | undefined
    id?: string | undefined
    locationBias?: Bias | undefined
}

const DEFAULT_LOCATION_BIAS = {
    north: 50.163,
    south: 49.447,
    east: 6.534,
    west: 5.736,
} as const

const placeSelectEventSchema = v.object({
    placePrediction: v.object({
        toPlace: v.function(),
    }),
})

function isPlaceSelectEvent(value: unknown): value is google.maps.places.PlacePredictionSelectEvent {
    return v.is(placeSelectEventSchema, value)
}

function handlePlaceSelectEvent(event: unknown, onChange: PlacesAutocompleteProps["onChange"]): void {
    if (!isPlaceSelectEvent(event)) {
        return
    }
    const place = event.placePrediction.toPlace()
    void place
        .fetchFields({
            fields: ["displayName", "formattedAddress", "id", "primaryType"],
        })
        .then(() => {
            const address =
                [place.formattedAddress, place.displayName].find(
                    (part) => part !== null && part !== undefined && part !== "",
                ) ?? ""
            onChange({
                address,
                ...(place.displayName !== null && place.displayName !== undefined && place.displayName !== ""
                    ? { name: place.displayName }
                    : {}),
                ...(place.id !== undefined ? { placeId: place.id } : {}),
                ...(place.primaryType !== null && place.primaryType !== undefined && place.primaryType !== ""
                    ? { primaryType: place.primaryType }
                    : {}),
            })
        })
}

function mountAutocomplete(params: {
    placesLib: google.maps.PlacesLibrary
    container: HTMLDivElement
    inputId: string
    locationBias: Bias
    onChangeRef: { readonly current: PlacesAutocompleteProps["onChange"] }
    setUseFallback: (visible: boolean) => void
}): () => void {
    const { placesLib, container, inputId, locationBias, onChangeRef, setUseFallback } = params
    const autocompleteElement = new placesLib.PlaceAutocompleteElement({
        includedPrimaryTypes: ["establishment"],
        locationBias: { ...locationBias },
    })
    autocompleteElement.style.width = "100%"
    autocompleteElement.style.colorScheme = "light"
    autocompleteElement.id = inputId
    autocompleteElement.className = control()

    const onSelect = (event: Event) => {
        handlePlaceSelectEvent(event, onChangeRef.current)
    }
    autocompleteElement.addEventListener("gmp-select", onSelect)

    container.appendChild(autocompleteElement)
    setUseFallback(false)

    const observer = new MutationObserver(() => {
        setUseFallback(container.children.length === 0)
    })
    observer.observe(container, { childList: true })
    return () => {
        observer.disconnect()
        autocompleteElement.removeEventListener("gmp-select", onSelect)
        autocompleteElement.remove()
    }
}

export function PlacesAutocomplete({
    value,
    onChange,
    placeholder,
    label,
    className,
    id,
    locationBias = DEFAULT_LOCATION_BIAS,
}: Readonly<PlacesAutocompleteProps>) {
    const placesLib = useMapsLibrary("places")
    const containerRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)
    const [useFallback, setUseFallback] = useState(true)
    const fallbackId = useId()
    const inputId = id ?? fallbackId
    const onChangeRef = useRef(onChange)
    // Latest-ref assignment during render: the mounted widget always calls the current handler.
    onChangeRef.current = onChange
    const biasKey = `${locationBias.north},${locationBias.south},${locationBias.east},${locationBias.west}`

    useEffect(() => {
        const container = containerRef.current
        if (placesLib === null || container === null || initializedRef.current) {
            return () => {}
        }
        initializedRef.current = true
        const cleanup = mountAutocomplete({
            placesLib,
            container,
            inputId,
            locationBias,
            onChangeRef,
            setUseFallback,
        })
        return () => {
            cleanup()
            initializedRef.current = false
        }
    }, [placesLib, inputId, biasKey])

    return (
        <div data-slot="places-autocomplete" className="flex flex-col gap-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={inputId} className={fieldLabel()}>
                    {label}
                </label>
            )}
            <div className="relative">
                <div ref={containerRef} className={className} />
                {useFallback && (
                    <input
                        id={inputId}
                        type="text"
                        value={value}
                        placeholder={placeholder}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            onChange({ address: event.currentTarget.value })
                        }}
                        className={cx(control(), "absolute inset-0 z-10", "text-base md:text-sm")}
                        data-fallback-location
                    />
                )}
            </div>
            <div className="flex justify-end pt-1">
                <GoogleAttribution />
            </div>
        </div>
    )
}
