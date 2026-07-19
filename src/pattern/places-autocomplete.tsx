import { useRef, useState, useEffect } from "react"
import { useMapsLibrary } from "@vis.gl/react-google-maps"

type PlaceAutocompleteElement = new (options?: {
    types?: string[]
    locationBias?: { north: number; south: number; east: number; west: number }
}) => HTMLElement & {
    style: CSSStyleDeclaration & { colorScheme?: "light" | "dark" }
    addEventListener(type: "gmp-select", listener: (event: PlaceSelectEvent) => void): void
}

type PlacesAutocompleteProps = {
    value: string
    onChange: (value: string, lat?: number, lng?: number, placeId?: string) => void
    placeholder?: string
    label?: string
    className?: string
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

export function PlacesAutocomplete({ value, onChange, placeholder, label, className }: PlacesAutocompleteProps) {
    const placesLib = useMapsLibrary("places")
    const containerRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)
    const [useFallback, setUseFallback] = useState(true)

    useEffect(() => {
        const container = containerRef.current
        const places = placesLib
        if (!places || !container || initializedRef.current) return
        initializedRef.current = true

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
                fields: ["displayName", "formattedAddress", "location", "id"],
            })

            const lat = place.location?.lat()
            const lng = place.location?.lng()
            const address = place.formattedAddress || place.displayName || ""
            const placeId = (place as unknown as { id?: string }).id

            onChange(address, lat ?? undefined, lng ?? undefined, placeId)
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
            {label && (
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
            )}
            <div className="relative">
                <div ref={containerRef} className={className} />
                {useFallback && (
                    <input
                        type="text"
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => onChange(e.currentTarget.value)}
                        className="absolute inset-0 z-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
                        data-fallback-location
                    />
                )}
            </div>
        </div>
    )
}
