// SYNC: docs page lives in src/routes/ds/-sections/carousel.tsx; keep the demo aligned with this file.
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import useEmblaCarousel from "embla-carousel-react"
import { useEffect, useState } from "react"

import { CarouselContext, useCarousel, type CarouselProps } from "@ui/carousel.context"
import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function Carousel({
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
}: Readonly<React.ComponentProps<"div"> & CarouselProps>) {
    const [carouselRef, api] = useEmblaCarousel(
        {
            ...opts,
            axis: orientation === "horizontal" ? "x" : "y",
        },
        plugins,
    )
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)

    const scrollPrev = () => {
        api?.scrollPrev()
    }

    const scrollNext = () => {
        api?.scrollNext()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            scrollPrev()
        } else if (event.key === "ArrowRight") {
            event.preventDefault()
            scrollNext()
        }
    }

    useEffect(() => {
        if (!api || !setApi) {
            return
        }
        setApi(api)
    }, [api, setApi])

    useEffect(() => {
        if (!api) {
            return () => {}
        }
        const onSelect = () => {
            setCanScrollPrev(api.canScrollPrev())
            setCanScrollNext(api.canScrollNext())
        }
        queueMicrotask(onSelect)
        api.on("reInit", onSelect)
        api.on("select", onSelect)

        return () => {
            api.off("reInit", onSelect)
            api.off("select", onSelect)
        }
    }, [api])

    return (
        <CarouselContext
            value={{
                carouselRef,
                api,
                opts,
                orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                scrollPrev,
                scrollNext,
                canScrollPrev,
                canScrollNext,
            }}
        >
            <div
                onKeyDownCapture={handleKeyDown}
                className={cx("relative", className)}
                role="region"
                aria-roledescription="carousel"
                data-slot="carousel"
                {...props}
            >
                {children}
            </div>
        </CarouselContext>
    )
}

export function CarouselContent({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
    const { carouselRef, orientation } = useCarousel()

    return (
        <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
            <div
                className={cx("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
                {...props}
            />
        </div>
    )
}

export function CarouselItem({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
    const { orientation } = useCarousel()

    return (
        <div
            role="group"
            aria-roledescription="slide"
            data-slot="carousel-item"
            className={cx(
                "min-w-0 shrink-0 grow-0 basis-full",
                orientation === "horizontal" ? "pl-4" : "pt-4",
                className,
            )}
            {...props}
        />
    )
}

type CarouselArrowProps = Readonly<
    Omit<React.ComponentProps<typeof IconButton>, "label"> & {
        readonly label?: string | undefined
    }
>

export function CarouselPrevious({ className, children, label = "Previous slide", ...props }: CarouselArrowProps) {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel()

    return (
        <IconButton
            data-slot="carousel-previous"
            label={label}
            className={cx(
                "absolute z-10 touch-manipulation",
                orientation === "horizontal"
                    ? "inset-y-0 -left-12 my-auto"
                    : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
                className,
            )}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            {...props}
        >
            {children ?? <CaretLeftIcon className="size-5" aria-hidden="true" />}
        </IconButton>
    )
}

export function CarouselNext({ className, children, label = "Next slide", ...props }: CarouselArrowProps) {
    const { orientation, scrollNext, canScrollNext } = useCarousel()

    return (
        <IconButton
            data-slot="carousel-next"
            label={label}
            className={cx(
                "absolute z-10 touch-manipulation",
                orientation === "horizontal"
                    ? "inset-y-0 -right-12 my-auto"
                    : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
                className,
            )}
            disabled={!canScrollNext}
            onClick={scrollNext}
            {...props}
        >
            {children ?? <CaretRightIcon className="size-5" aria-hidden="true" />}
        </IconButton>
    )
}
