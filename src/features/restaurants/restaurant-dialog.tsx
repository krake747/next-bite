import { ForkKnifeIcon } from "@phosphor-icons/react"
import { useRef } from "react"

import { type Restaurant } from "@core/restaurants"
import { useAuth } from "@core/session"
import { ButtonLink } from "@pattern/button-link"
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

import { RestaurantForm } from "./restaurant-form"

type RestaurantDialogProps =
    | Readonly<{ mode: "add"; show: boolean; onOpenChange: (open: boolean) => void }>
    | Readonly<{ mode: "edit"; show: boolean; onOpenChange: (open: boolean) => void; restaurant: Restaurant }>

export function RestaurantDialog(props: RestaurantDialogProps) {
    const auth = useAuth()
    const title = props.mode === "add" ? "Add Restaurant" : "Edit Restaurant"
    const gateText = props.mode === "add" ? "Please sign in to add restaurants." : "Please sign in to edit restaurants."

    // Every dialog exit shares one ownership policy: the form's discard runs on
    // explicit Cancel, backdrop clicks, and Escape alike, so staged uploads are
    // never stranded by the exit path taken.
    const discardRef = useRef<() => Promise<void>>(async () => {})
    const registerDiscard = (discard: () => Promise<void>) => {
        discardRef.current = discard
    }
    const close = () => {
        void discardRef.current().then(() => {
            props.onOpenChange(false)
        })
    }
    const handleOpenChange = (open: boolean) => {
        if (open) {
            props.onOpenChange(open)
        } else {
            close()
        }
    }

    return (
        <Dialog open={props.show} onOpenChange={handleOpenChange}>
            <DialogContent size="md" className="max-h-[85vh]">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-tomato-500 to-tomato-600 text-inverse">
                        <ForkKnifeIcon className="size-5" />
                    </div>
                    <DialogTitle size="lg">{title}</DialogTitle>
                </div>

                {auth.isAuthenticated ? (
                    props.mode === "add" ? (
                        <RestaurantForm
                            mode="add"
                            onSuccess={close}
                            onCancel={close}
                            onDiscardReady={registerDiscard}
                        />
                    ) : (
                        <RestaurantForm
                            mode="edit"
                            restaurant={props.restaurant}
                            onSuccess={close}
                            onCancel={close}
                            onDiscardReady={registerDiscard}
                        />
                    )
                ) : (
                    <div className="space-y-4 py-8 text-center">
                        <p className="text-muted-foreground">{gateText}</p>
                        <ButtonLink to="/login" className="w-full">
                            Sign In
                        </ButtonLink>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
