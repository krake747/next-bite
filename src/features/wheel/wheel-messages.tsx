import { createSignal, createEffect, For } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import Sparkles from "lucide-solid/icons/sparkles"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import Star from "lucide-solid/icons/star"
import Share from "lucide-solid/icons/share"

type Particle = {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    color: string
    randSign: number
    randY: number
}

const PARTICLE_COLORS = ["#f97316", "#fbbf24", "#f59e0b", "#ef4444", "#ec4899"]

function CelebrationParticles() {
    const [particles, setParticles] = createSignal<Particle[]>([])

    createEffect(() => {
        const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => {
            const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!
            return {
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 6 + 4,
                duration: Math.random() * 1000 + 1500,
                delay: Math.random() * 800,
                color,
                randSign: Math.random() > 0.5 ? 1 : -1,
                randY: Math.random() * 50,
            }
        })
        setParticles(newParticles)
    })

    return (
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <For each={particles()}>
                {(particle) => (
                    <div
                        class="animate-celebrate-particle absolute rounded-full"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            background: particle.color,
                            "animation-duration": `${particle.duration}ms`,
                            "animation-delay": `${particle.delay}ms`,
                            "--rand-sign": particle.randSign,
                            "--rand-y": `${particle.randY}px`,
                        }}
                    />
                )}
            </For>
        </div>
    )
}

function SpotlightRing() {
    return (
        <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div class="animate-ping-slow absolute -inset-8 rounded-full bg-flame-pea-500/20 blur-2xl" />
            <div class="animate-pulse-slow absolute -inset-12 rounded-full bg-flame-pea-400/10 blur-3xl" />
        </div>
    )
}

export function Instructions() {
    return (
        <div class="text-center">
            <div class="mb-3 flex justify-center">
                <div class="flex size-12 items-center justify-center rounded-full bg-flame-pea-100 dark:bg-flame-pea-900/30">
                    <UtensilsCrossed class="size-6 text-flame-pea-600 dark:text-flame-pea-400" />
                </div>
            </div>
            <p
                class="text-lg leading-relaxed font-medium text-neutral-700 dark:text-neutral-300"
                style={{ "font-family": "var(--font-body)" }}
            >
                Press the button to give the wheel a whirl.
            </p>
            <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-500">
                Let fate (or your stomach) decide where to dine.
            </p>
        </div>
    )
}

import { RestaurantCard } from "../../features/restaurants/restaurant-card"
import { Button } from "../../ui/button"
import type { Restaurant } from "../../core/hooks"

export function WinnerModal(props: {
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurant: Restaurant
    onSpinAgain: () => void
    isSpinning: boolean
}) {
    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm duration-300"
                    onClick={() => props.onOpenChange(false)}
                >
                    <Dialog.Content
                        class="animate-winner-modal relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl outline-none dark:bg-neutral-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div class="pointer-events-none absolute inset-0 -mx-6 -mt-20 mb-12 flex items-center justify-center">
                            <SpotlightRing />
                            <CelebrationParticles />
                        </div>

                        <div class="relative p-6 pt-12">
                            <div class="relative mb-6 flex justify-center">
                                <div class="relative">
                                    <div class="animate-winner-glow absolute inset-0 rounded-full bg-flame-pea-400/30 blur-2xl" />
                                    <div class="relative flex size-20 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-500 via-flame-pea-600 to-flame-pea-800 shadow-2xl ring-4 ring-flame-pea-400/30">
                                        <Sparkles class="size-10 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div class="relative mb-2 flex items-center justify-center gap-2">
                                <div class="h-px w-8 bg-linear-to-r from-transparent to-flame-pea-400/50" />
                                <div class="flex items-center gap-1 text-xs font-medium tracking-widest text-flame-pea-600 uppercase dark:text-flame-pea-400">
                                    <Star class="size-3 fill-current" />
                                    Winner
                                    <Star class="size-3 fill-current" />
                                </div>
                                <div class="h-px w-8 bg-linear-to-l from-transparent to-flame-pea-400/50" />
                            </div>

                            <Dialog.Title class="sr-only">Winner</Dialog.Title>

                            <h2
                                class="animate-title-reveal bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-center text-4xl leading-tight font-bold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-400"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                {props.restaurant.name}
                            </h2>

                            <p class="animate-fade-in-up mt-3 text-center text-base text-neutral-600 dark:text-neutral-400">
                                Your next culinary adventure awaits
                            </p>

                            <div class="animate-card-reveal mt-6">
                                <RestaurantCard restaurant={props.restaurant} />
                            </div>

                            <div class="mt-6 flex gap-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={props.onSpinAgain}
                                    disabled={props.isSpinning}
                                    class="flex-1"
                                >
                                    <Sparkles class="size-5" />
                                    <span>Spin Again</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={() => {
                                        const lat = props.restaurant.lat
                                        const lng = props.restaurant.lng
                                        const inviteUrl = `${window.location.origin}/wheel`
                                        const mapsUrl =
                                            lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : undefined
                                        const mapsLine = mapsUrl ? `\n\n📍 Google Maps: ${mapsUrl}` : ""
                                        const message = `Just tried the dinner wheel... fate is UNHINGED! 😂 We're going to ${props.restaurant.name}!${mapsLine}\n\nYou gotta try this -> ${inviteUrl}`
                                        navigator.clipboard.writeText(message).then(() => {
                                            alert("Copied to clipboard!")
                                        })
                                    }}
                                    class="flex-1"
                                >
                                    <Share class="size-5" />
                                    <span>Share</span>
                                </Button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog>
    )
}
