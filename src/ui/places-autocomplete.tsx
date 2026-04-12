import { useCallback, useEffect, useRef } from "solid-js"
import { useGoogleMaps } from "solid-google-maps"

type PlacesAutocompleteProps = {
    value: string
    onChange: (value: string, lat?: number, lng?: number) => void
    placeholder?: string
    class?: string
}

type PlaceSelectEvent = {
    placePrediction: {
        toPlace(): {
            fetchFields(options: { fields: string[] }): Promise<void>
            location?: { lat(): number; lng(): number }
            formattedAddress?: string
            displayName?: string
        }
    }
}

export function PlacesAutocomplete(props: PlacesAutocompleteProps) {
    const api = useGoogleMaps()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const initializedRef = useRef(false)

    const initAutocomplete = useCallback(
        async (container: HTMLDivElement) => {
            if (!api || initializedRef.current) return
            initializedRef.current = true

            const placesLib = (await api.importLibrary("places")) as google.maps.PlacesLibrary
            const PlaceAutocompleteElement = placesLib.PlaceAutocompleteElement

            const isDark = document.documentElement.classList.contains("dark")

            const autocompleteElement = new PlaceAutocompleteElement({
                types: ["establishment"],
                locationBias: {
                    north: 50.163,
                    south: 49.447,
                    east: 6.534,
                    west: 5.736,
                },
            })

            autocompleteElement.style.width = "100%"
            autocompleteElement.style.colorScheme = isDark ? "dark" : "light"

            autocompleteElement.className =
                "w-full rounded-md border border-neutral-300 bg-white text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"

            autocompleteElement.addEventListener("gmp-select", async (event: PlaceSelectEvent) => {
                const placePrediction = event.placePrediction
                if (!placePrediction) return

                const place = placePrediction.toPlace()
                await place.fetchFields({
                    fields: ["displayName", "formattedAddress", "location"],
                })

                const lat = place.location?.lat()
                const lng = place.location?.lng()
                const address = place.formattedAddress || place.displayName || ""

                props.onChange(address, lat ?? undefined, lng ?? undefined)
            })

            container.appendChild(autocompleteElement)
        },
        [api, props.onChange],
    )

    useEffect(() => {
        const container = containerRef.current
        if (container) {
            initAutocomplete(container)
        }
        return () => {
            initializedRef.current = false
        }
    }, [initAutocomplete])

    return <div ref={containerRef} class={props.class} />
}
