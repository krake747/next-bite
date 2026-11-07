import { createContext, use, useState } from "react"

import { useAuth } from "@core/hooks"

import { AddRestaurantDialog } from "./add-restaurant-dialog"

const AddRestaurantContext = createContext<() => void>(() => {})

export function useOpenAddRestaurant(): () => void {
    return use(AddRestaurantContext)
}

export function AddRestaurantProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    const [show, setShow] = useState(false)
    return (
        <AddRestaurantContext.Provider
            value={() => {
                setShow(true)
            }}
        >
            {children}
            {auth.isAuthenticated && <AddRestaurantDialog show={show} onOpenChange={setShow} />}
        </AddRestaurantContext.Provider>
    )
}
