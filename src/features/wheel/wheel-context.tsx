import { createContext, useContext } from "solid-js"
import { useWheelStore } from "./wheel-store"

export type WheelStoreType = ReturnType<typeof useWheelStore>

const WheelContext = createContext<WheelStoreType>()

export function WheelProvider(props: { store: WheelStoreType; children: any }) {
    return <WheelContext.Provider value={props.store}>{props.children}</WheelContext.Provider>
}

export function useWheel() {
    const ctx = useContext(WheelContext)
    if (!ctx) {
        throw new Error("useWheel must be used within a WheelProvider")
    }
    return ctx
}
