import Share from "lucide-react/icons/share"
import Sparkles from "lucide-react/icons/sparkles"
import Star from "lucide-react/icons/star"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import { useState } from "react"

import { type Restaurant } from "@core/hooks"
import { Button } from "@ui/button"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "@ui/dialog"

import { WinnerCard } from "./winner-card"

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
    const [particles] = useState<Particle[]>(() =>
        Array.from({ length: 24 }, (_, i) => {
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
        }),
    )

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((particle: Readonly<Particle>) => (
                <div
                    key={particle.id}
                    className="animate-celebrate-particle absolute rounded-full"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        background: particle.color,
                        animationDuration: `${particle.duration}ms`,
                        animationDelay: `${particle.delay}ms`,
                        ["--rand-sign" as string]: particle.randSign,
                        ["--rand-y" as string]: `${particle.randY}px`,
                    }}
                />
            ))}
        </div>
    )
}

function SpotlightRing() {
    return (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-ping-slow absolute -inset-8 rounded-full bg-tomato-500/20 blur-2xl" />
            <div className="animate-pulse-slow absolute -inset-12 rounded-full bg-tomato-400/10 blur-3xl" />
        </div>
    )
}

export function Instructions() {
    return (
        <div className="flex items-center justify-center gap-3 text-center">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tomato-100 sm:size-10">
                <UtensilsCrossed className="size-4 text-tomato-600 sm:size-5" />
            </div>
            <p
                className="text-sm leading-relaxed font-medium text-stone-700 sm:text-base"
                style={{ fontFamily: "var(--font-body)" }}
            >
                Press the button to give the wheel a whirl.
            </p>
        </div>
    )
}

export function WinnerModal({
    show,
    onOpenChange,
    restaurant,
    onSpinAgain,
    isSpinning,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurant: Restaurant
    onSpinAgain: () => void
    isSpinning: boolean
}>) {
    return (
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop
                tone="deep"
                onClick={() => {
                    onOpenChange(false)
                }}
            >
                <DialogPanel
                    size="sm"
                    padding="none"
                    tone="celebration"
                    onClick={(e: Readonly<{ stopPropagation: () => void }>) => {
                        e.stopPropagation()
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 -mx-4 -mt-16 flex items-center justify-center">
                        <SpotlightRing />
                        <CelebrationParticles />
                    </div>

                    <div className="relative px-5 pt-8 pb-5">
                        <DialogCloseButton
                            onClose={() => {
                                onOpenChange(false)
                            }}
                            tone="soft"
                            className="top-2 right-2"
                        />

                        <div className="relative mb-4 flex justify-center">
                            <div className="relative">
                                <div className="animate-winner-glow absolute inset-0 rounded-full bg-tomato-400/30 blur-xl" />
                                <div className="relative flex size-14 items-center justify-center rounded-full bg-linear-to-br from-tomato-500 via-tomato-600 to-tomato-800 shadow-lg ring-4 ring-tomato-400/20">
                                    <Sparkles className="size-7 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="relative mb-3 flex items-center justify-center gap-2">
                            <div className="h-px w-6 bg-linear-to-r from-transparent to-tomato-400/50" />
                            <div className="flex items-center gap-1 text-xs font-medium tracking-widest text-tomato-600 uppercase">
                                <Star className="size-2.5 fill-current" />
                                Winner
                                <Star className="size-2.5 fill-current" />
                            </div>
                            <div className="h-px w-6 bg-linear-to-l from-transparent to-tomato-400/50" />
                        </div>

                        <DialogTitle className="sr-only">Winner</DialogTitle>

                        <h2
                            className="animate-title-reveal bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            {restaurant.name}
                        </h2>

                        <p className="animate-fade-in-up mt-1.5 text-center text-xs text-stone-500">
                            Your next culinary adventure awaits
                        </p>

                        <div className="animate-card-reveal mt-4">
                            <WinnerCard restaurant={restaurant} />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="primary"
                                size="md"
                                onClick={onSpinAgain}
                                disabled={isSpinning}
                                className="flex-1"
                            >
                                <Sparkles className="size-4" />
                                <span>Spin Again</span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => {
                                    const lat = restaurant.lat
                                    const lng = restaurant.lng
                                    const inviteUrl = `${window.location.origin}/wheel`
                                    const mapsUrl =
                                        lat !== null && lng !== null
                                            ? `https://maps.google.com/?q=${lat},${lng}`
                                            : undefined
                                    const mapsLine =
                                        mapsUrl !== undefined && mapsUrl !== "" ? `\n\n📍 Google Maps: ${mapsUrl}` : ""
                                    const text = `Just tried the dinner wheel... fate is UNHINGED! 😂 We're going to ${restaurant.name}!${mapsLine}\n\nYou gotta try this -> ${inviteUrl}`
                                    const shareData = { title: "Next Bite", text }
                                    if (
                                        navigator.share !== undefined &&
                                        navigator.canShare !== undefined &&
                                        navigator.canShare(shareData)
                                    ) {
                                        void navigator.share(shareData).catch(() => {
                                            void navigator.clipboard
                                                .writeText(text)
                                                .then(() => {
                                                    alert("Copied to clipboard!")
                                                })
                                                .catch(() => {
                                                    alert("Failed to share. Please try again.")
                                                })
                                        })
                                    } else {
                                        void navigator.clipboard
                                            .writeText(text)
                                            .then(() => {
                                                alert("Copied to clipboard!")
                                            })
                                            .catch(() => {
                                                alert("Failed to copy. Please try again.")
                                            })
                                    }
                                }}
                                className="flex-1"
                            >
                                <Share className="size-4" />
                                <span>Share</span>
                            </Button>
                        </div>
                    </div>
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
