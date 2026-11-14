import { useEffect, useState } from "react"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@ui/carousel"
import { type CarouselApi } from "@ui/carousel.context"

import { Demo } from "./demo-frame"

export const carouselMeta = {
    id: "carousel",
    group: "Components",
    title: "Carousel",
    body: "Browse peer slides in place with swipe and arrows. One slide shows at a time; the arrows report the ends.",
    importPath: "src/ui/carousel.tsx",
    anatomy: [
        {
            element: "Carousel",
            description: "Owns the Embla engine, orientation, and keyboard handling.",
        },
        {
            element: "CarouselContent",
            description: "The clipped viewport that holds the slide track.",
        },
        {
            element: "CarouselItem",
            description: "One full-width slide. Keep slides the same size.",
        },
        {
            element: "CarouselPrevious / CarouselNext",
            description: "Overlay arrows that disable themselves at the ends.",
        },
    ],
    props: [
        {
            name: "opts",
            type: "CarouselOptions",
            description: "Embla options such as loop and align. Passed through to the engine.",
        },
        {
            name: "orientation",
            type: '"horizontal" | "vertical"',
            description: "Slide axis. Horizontal by default.",
        },
        {
            name: "setApi",
            type: "(api: CarouselApi) => void",
            description: "Receives the Embla instance for dots, counts, and outside control.",
        },
        {
            name: "tone",
            type: '"neutral" | "destructive" | "plain" | "inverse"',
            description: "Arrow tone on CarouselPrevious and CarouselNext. Inverse sits on imagery.",
        },
        {
            name: "size",
            type: '"xs" | "sm" | "md" | "lg"',
            description: "Arrow size on CarouselPrevious and CarouselNext.",
        },
    ],
    guidance: {
        whenToUse:
            "Browse a short list of same-size peer slides where one shows at a time, such as restaurant photos. Pair with dots or a count when position matters.",
        whenToAvoid:
            "Do not use for peer views that need labels or for sequential steps; those are Tabs or an explicit flow. For fullscreen image viewing, use the Dialog-based Lightbox.",
        siblings: [
            {
                id: "dialog",
                reason: "Fullscreen viewing uses the Dialog-based Lightbox, inline browsing uses Carousel.",
            },
        ],
    },
} as const

const demoSlides = ["First bite", "Second helping", "Dessert"] as const

export function CarouselDemo() {
    const [api, setApi] = useState<CarouselApi>()
    const [selected, setSelected] = useState(0)

    useEffect(() => {
        if (!api) {
            return () => {}
        }
        const onSelect = () => {
            setSelected(api.selectedScrollSnap())
        }
        onSelect()
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    return (
        <Demo>
            <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-sm">
                <CarouselContent>
                    {demoSlides.map((slide) => (
                        <CarouselItem key={slide} aria-label={slide}>
                            <div className="grid h-40 place-items-center rounded-card border border-border bg-surface-muted">
                                <p className="font-display text-lg font-semibold text-foreground">{slide}</p>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </Carousel>
            <div className="flex items-center justify-center gap-2 pt-4" aria-hidden={api === undefined}>
                {demoSlides.map((slide, index) => (
                    <button
                        key={slide}
                        type="button"
                        tabIndex={-1}
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => {
                            api?.scrollTo(index)
                        }}
                        className={
                            selected === index
                                ? "size-2 rounded-full bg-foreground"
                                : "size-2 rounded-full bg-border-strong"
                        }
                    />
                ))}
            </div>
        </Demo>
    )
}
