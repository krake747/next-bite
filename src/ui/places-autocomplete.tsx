import { onMount } from "solid-js"
import { useMapsLibrary } from "solid-google-maps"

type PlaceAutocompleteElement = new (options?: {
    types?: string[]
    locationBias?: { north: number; south: number; east: number; west: number }
}) => HTMLElement & {
    style: CSSStyleDeclaration & { colorScheme?: "light" | "dark" }
    addEventListener(type: "gmp-select", listener: (event: PlaceSelectEvent) => void): void
}

type PlacesAutocompleteProps = {
    value: string
    onChange: (value: string, lat?: number, lng?: number) => void
    placeholder?: string
    label?: string
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
    const placesLib = useMapsLibrary("places")
    let containerRef: HTMLDivElement | undefined // eslint-disable-line no-unassigned-vars
    let initialized = false

    const initAutocomplete = async (container: HTMLDivElement) => {
        const places = placesLib()
        if (!places || initialized) return
        initialized = true

        const PlaceAutocompleteElement = (places as unknown as { PlaceAutocompleteElement: PlaceAutocompleteElement })
            .PlaceAutocompleteElement

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
            "w-full rounded-lg border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:border-flame-pea-500 focus:outline-none focus:ring-1 focus:ring-flame-pea-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"

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

    onMount(() => {
        if (containerRef) {
            initAutocomplete(containerRef)
        }
    })

    return (
        <div class="space-y-1.5">
            {props.label && (
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{props.label}</label>
            )}
            <div ref={containerRef} class={props.class} />
        </div>
    )
}
