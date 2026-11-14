import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { createContext, use } from "react"

export type CarouselApi = UseEmblaCarouselType[1]

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

export type CarouselProps = {
    readonly opts?: CarouselOptions | undefined
    readonly plugins?: CarouselPlugin | undefined
    readonly orientation?: "horizontal" | "vertical" | undefined
    readonly setApi?: ((api: CarouselApi) => void) | undefined
}

type CarouselContextProps = {
    readonly carouselRef: ReturnType<typeof useEmblaCarousel>[0]
    readonly api: ReturnType<typeof useEmblaCarousel>[1]
    readonly scrollPrev: () => void
    readonly scrollNext: () => void
    readonly canScrollPrev: boolean
    readonly canScrollNext: boolean
} & CarouselProps

export const CarouselContext = createContext<CarouselContextProps | null>(null)

export function useCarousel() {
    const context = use(CarouselContext)

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }

    return context
}
