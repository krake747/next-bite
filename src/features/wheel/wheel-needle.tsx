export function WheelNeedle() {
    return (
        <div class="pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1">
            <div class="relative">
                <div
                    class="size-0 border-t-28 border-r-14 border-l-14 border-t-amber-500 border-r-transparent border-l-transparent"
                    style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                    }}
                />

                <div class="absolute top-1 left-1/2 h-3.5 w-0.5 -translate-x-1/2 bg-linear-to-b from-white/40 to-transparent" />
            </div>
        </div>
    )
}
