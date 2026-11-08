import { createContext, use, useState } from "react"

import { useAuth } from "@core/session"

import { AddRestaurantDialog } from "./add-restaurant-dialog"

const AddRestaurantContext = createContext<() => void>(() => {})

export function useOpenAddRestaurant(): () => void {
    return use(AddRestaurantContext)
}

export function AddRestaurantProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const auth = useAuth()
    const [show, setShow] = useState(false)
    const open = () => {
        setShow(true)
    }
    return (
        <AddRestaurantContext.Provider value={open}>
            {children}
            {auth.isAuthenticated && <AddRestaurantDialog show={show} onOpenChange={setShow} />}
        </AddRestaurantContext.Provider>
    )
}
