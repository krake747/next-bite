import { createSignal, createEffect, For } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import Sparkles from "lucide-solid/icons/sparkles"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import Star from "lucide-solid/icons/star"
import Share from "lucide-solid/icons/share"
import X from "lucide-solid/icons/x"

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
        <div class="flex items-center justify-center gap-3 text-center">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-flame-pea-100 sm:size-10 dark:bg-flame-pea-900/30">
                <UtensilsCrossed class="size-4 text-flame-pea-600 sm:size-5 dark:text-flame-pea-400" />
            </div>
            <p
                class="text-sm leading-relaxed font-medium text-neutral-700 sm:text-base dark:text-neutral-300"
                style={{ "font-family": "var(--font-body)" }}
            >
                Press the button to give the wheel a whirl.
            </p>
        </div>
    )
}

import { WinnerCard } from "./winner-card"
import { Button } from "@ui/button"
import type { Restaurant } from "@core/hooks"

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
                    class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm duration-200"
                    onClick={() => props.onOpenChange(false)}
                >
                    <Dialog.Content
                        class="animate-winner-modal relative w-[90%] max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-neutral-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div class="pointer-events-none absolute inset-0 -mx-4 -mt-16 flex items-center justify-center">
                            <SpotlightRing />
                            <CelebrationParticles />
                        </div>

                        <div class="relative px-5 pt-8 pb-5">
                            <button
                                onClick={() => props.onOpenChange(false)}
                                class="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                            >
                                <X class="size-4" />
                            </button>

                            <div class="relative mb-4 flex justify-center">
                                <div class="relative">
                                    <div class="animate-winner-glow absolute inset-0 rounded-full bg-flame-pea-400/30 blur-xl" />
                                    <div class="relative flex size-14 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-500 via-flame-pea-600 to-flame-pea-800 shadow-lg ring-4 ring-flame-pea-400/20">
                                        <Sparkles class="size-7 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div class="relative mb-3 flex items-center justify-center gap-2">
                                <div class="h-px w-6 bg-linear-to-r from-transparent to-flame-pea-400/50" />
                                <div class="flex items-center gap-1 text-xs font-medium tracking-widest text-flame-pea-600 uppercase dark:text-flame-pea-400">
                                    <Star class="size-2.5 fill-current" />
                                    Winner
                                    <Star class="size-2.5 fill-current" />
                                </div>
                                <div class="h-px w-6 bg-linear-to-l from-transparent to-flame-pea-400/50" />
                            </div>

                            <Dialog.Title class="sr-only">Winner</Dialog.Title>

                            <h2
                                class="animate-title-reveal bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-400"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                {props.restaurant.name}
                            </h2>

                            <p class="animate-fade-in-up mt-1.5 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                Your next culinary adventure awaits
                            </p>

                            <div class="animate-card-reveal mt-4">
                                <WinnerCard restaurant={props.restaurant} />
                            </div>

                            <div class="mt-4 flex gap-2">
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={props.onSpinAgain}
                                    disabled={props.isSpinning}
                                    class="flex-1"
                                >
                                    <Sparkles class="size-4" />
                                    <span>Spin Again</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    onClick={async () => {
                                        const lat = props.restaurant.lat
                                        const lng = props.restaurant.lng
                                        const inviteUrl = `${window.location.origin}/wheel`
                                        const mapsUrl =
                                            lat != null && lng != null
                                                ? `https://maps.google.com/?q=${lat},${lng}`
                                                : undefined
                                        const mapsLine = mapsUrl ? `\n\n📍 Google Maps: ${mapsUrl}` : ""
                                        const text = `Just tried the dinner wheel... fate is UNHINGED! 😂 We're going to ${props.restaurant.name}!${mapsLine}\n\nYou gotta try this -> ${inviteUrl}`
                                        const shareData = {
                                            title: "Next Bite",
                                            text: text,
                                        }
                                        if (navigator.share && navigator.canShare?.(shareData)) {
                                            try {
                                                await navigator.share(shareData)
                                            } catch {
                                                try {
                                                    await navigator.clipboard.writeText(text)
                                                    alert("Copied to clipboard!")
                                                } catch {
                                                    alert("Failed to share. Please try again.")
                                                }
                                            }
                                        } else {
                                            try {
                                                await navigator.clipboard.writeText(text)
                                                alert("Copied to clipboard!")
                                            } catch {
                                                alert("Failed to copy. Please try again.")
                                            }
                                        }
                                    }}
                                    class="flex-1"
                                >
                                    <Share class="size-4" />
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
