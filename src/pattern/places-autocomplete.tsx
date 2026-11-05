import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useRef, useState, useEffect, useId } from "react"

import { cx } from "@ui/cva.config"
import { control, fieldLabel } from "@ui/variants"

type PlacesAutocompleteProps = {
    value: string
    onChange: (value: string, lat?: number, lng?: number, placeId?: string) => void
    placeholder?: string | undefined
    label?: string | undefined
    className?: string | undefined
    id?: string | undefined
}

function isPlaceSelectEvent(value: unknown): value is google.maps.places.PlacePredictionSelectEvent {
    return (
        typeof value === "object" &&
        value !== null &&
        "placePrediction" in value &&
        typeof value.placePrediction === "object" &&
        value.placePrediction !== null &&
        "toPlace" in value.placePrediction &&
        typeof value.placePrediction.toPlace === "function"
    )
}

export function PlacesAutocomplete({
    value,
    onChange,
    placeholder,
    label,
    className,
    id,
}: Readonly<PlacesAutocompleteProps>) {
    const placesLib = useMapsLibrary("places")
    const containerRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)
    const [useFallback, setUseFallback] = useState(true)
    const fallbackId = useId()
    const inputId = id ?? fallbackId

    useEffect(() => {
        const container = containerRef.current
        const places = placesLib
        if (!places || !container || initializedRef.current) {
            return () => {}
        }
        initializedRef.current = true

        const PlaceAutocompleteElement = places.PlaceAutocompleteElement

        const autocompleteElement = new PlaceAutocompleteElement({
            includedPrimaryTypes: ["establishment"],
            locationBias: {
                north: 50.163,
                south: 49.447,
                east: 6.534,
                west: 5.736,
            },
        })

        autocompleteElement.style.width = "100%"
        autocompleteElement.style.colorScheme = "light"
        autocompleteElement.id = inputId

        autocompleteElement.className = control()

        const handlePlaceSelect = (event: unknown) => {
            if (!isPlaceSelectEvent(event)) {
                return
            }
            const place = event.placePrediction.toPlace()
            void place
                .fetchFields({
                    fields: ["displayName", "formattedAddress", "location", "id"],
                })
                .then(() => {
                    const lat = place.location?.lat()
                    const lng = place.location?.lng()
                    const address =
                        [place.formattedAddress, place.displayName].find(
                            (part) => part !== null && part !== undefined && part !== "",
                        ) ?? ""
                    const placeId = place.id ?? undefined

                    onChange(address, lat ?? undefined, lng ?? undefined, placeId)
                })
        }

        const onSelect = (event: Event) => {
            handlePlaceSelect(event)
        }
        autocompleteElement.addEventListener("gmp-select", onSelect)

        container.appendChild(autocompleteElement)

        const timer = setTimeout(() => {
            if (container.children.length > 0) {
                setUseFallback(false)
            }
        }, 500)
        return () => {
            clearTimeout(timer)
            autocompleteElement.removeEventListener("gmp-select", onSelect)
            autocompleteElement.remove()
            initializedRef.current = false
        }
    }, [placesLib, onChange, inputId])

    return (
        <div className="flex flex-col gap-1.5">
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
                            onChange(event.currentTarget.value)
                        }}
                        className={cx(control(), "absolute inset-0 z-10", "text-base md:text-sm")}
                        data-fallback-location
                    />
                )}
            </div>
        </div>
    )
}
