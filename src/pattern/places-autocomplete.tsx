import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useRef, useState, useEffect } from "react"

type PlacesAutocompleteProps = {
    value: string
    onChange: (value: string, lat?: number, lng?: number, placeId?: string) => void
    placeholder?: string | undefined
    label?: string | undefined
    className?: string | undefined
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
}: Readonly<PlacesAutocompleteProps>) {
    const placesLib = useMapsLibrary("places")
    const containerRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)
    const [useFallback, setUseFallback] = useState(true)

    useEffect(() => {
        const container = containerRef.current
        const places = placesLib
        if (!places || !container || initializedRef.current) {
            return
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

        autocompleteElement.className =
            "w-full rounded-lg border border-stone-200 bg-surface text-stone-900 text-sm placeholder:text-stone-400 focus:border-tomato-500 focus:outline-none focus:ring-1 focus:ring-tomato-500"

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

        autocompleteElement.addEventListener("gmp-select", (event: unknown) => {
            handlePlaceSelect(event)
        })

        container.appendChild(autocompleteElement)

        setTimeout(() => {
            if (container.children.length > 0) {
                setUseFallback(false)
            }
        }, 500)
    }, [placesLib, onChange])

    return (
        <div className="space-y-1.5">
            {label !== undefined && label !== "" && (
                <label className="block text-sm font-medium text-stone-700">{label}</label>
            )}
            <div className="relative">
                <div ref={containerRef} className={className} />
                {useFallback && (
                    <input
                        type="text"
                        value={value}
                        placeholder={placeholder}
                        onChange={(e: Readonly<{ readonly currentTarget: Readonly<{ readonly value: string }> }>) => {
                            onChange(e.currentTarget.value)
                        }}
                        className="absolute inset-0 z-10 w-full rounded-lg border border-stone-200 bg-surface px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-tomato-500 focus:ring-1 focus:ring-tomato-500 focus:outline-none"
                        data-fallback-location
                    />
                )}
            </div>
        </div>
    )
}
