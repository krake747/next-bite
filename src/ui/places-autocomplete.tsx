interface PlacesAutocompleteProps {
    value: string
    onChange: (value: string, lat?: number, lng?: number) => void
    placeholder?: string
    class?: string
}

interface PlaceAutocompleteElement {
    new (options?: {
        types?: string[]
        locationBias?: { north: number; south: number; east: number; west: number }
    }): HTMLElement & {
        style: CSSStyleDeclaration & { colorScheme?: "light" | "dark" }
        addEventListener(type: "gmp-select", listener: (event: PlaceSelectEvent) => void): void
    }
}

interface PlaceSelectEvent {
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
    const containerRef = (el: HTMLDivElement) => {
        initAutocomplete(el)
    }

    const initAutocomplete = async (container: HTMLDivElement) => {
        const placesLib = (await google.maps.importLibrary("places")) as unknown as {
            PlaceAutocompleteElement: PlaceAutocompleteElement
        }
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
    }

    return <div ref={containerRef} />
}
