import { createContext, useContext, type ReactNode } from "react"

import { useWheelStore } from "./wheel-store"

export type WheelStoreType = ReturnType<typeof useWheelStore>

const WheelContext = createContext<WheelStoreType | null>(null)

export function WheelProvider({ store, children }: { store: WheelStoreType; children: ReactNode }) {
    return <WheelContext.Provider value={store}>{children}</WheelContext.Provider>
}

export function useWheel() {
    const ctx = useContext(WheelContext)
    if (!ctx) {
        throw new Error("useWheel must be used within a WheelProvider")
    }
    return ctx
}
