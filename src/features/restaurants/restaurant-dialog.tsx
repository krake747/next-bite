import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth, type Restaurant } from "@core/hooks"
import { Button } from "@ui/button"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@ui/dialog"

import { RestaurantForm } from "./restaurant-form"

type RestaurantDialogProps =
    | Readonly<{ mode: "add"; show: boolean; onOpenChange: (open: boolean) => void }>
    | Readonly<{ mode: "edit"; show: boolean; onOpenChange: (open: boolean) => void; restaurant: Restaurant }>

export function RestaurantDialog(props: RestaurantDialogProps) {
    const auth = useAuth()
    const title = props.mode === "add" ? "Add Restaurant" : "Edit Restaurant"
    const gateText = props.mode === "add" ? "Please sign in to add restaurants." : "Please sign in to edit restaurants."

    const close = () => {
        props.onOpenChange(false)
    }

    return (
        <Dialog show={props.show} onOpenChange={props.onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="md" className="max-h-[85vh]">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-tomato-500 to-tomato-600 text-inverse">
                            <UtensilsCrossed className="size-5" />
                        </div>
                        <DialogTitle size="lg">{title}</DialogTitle>
                    </div>

                    {auth.isAuthenticated ? (
                        props.mode === "add" ? (
                            <RestaurantForm mode="add" onSuccess={close} onCancel={close} />
                        ) : (
                            <RestaurantForm
                                mode="edit"
                                restaurant={props.restaurant}
                                onSuccess={close}
                                onCancel={close}
                            />
                        )
                    ) : (
                        <div className="space-y-4 py-8 text-center">
                            <p className="text-stone-600">{gateText}</p>
                            <Button render={<Link to="/login" viewTransition />} className="w-full">
                                Sign In
                            </Button>
                        </div>
                    )}
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
