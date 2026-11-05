import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@ui/dialog"

import { RestaurantForm } from "./restaurant-form"

export function AddRestaurantDialog({
    show,
    onOpenChange,
}: Readonly<{ show: boolean; onOpenChange: (open: boolean) => void }>) {
    const auth = useAuth()

    const handleSuccess = () => {
        onOpenChange(false)
    }
    const handleCancel = () => {
        onOpenChange(false)
    }

    return (
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="md" className="max-h-[85vh]">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-tomato-500 to-tomato-600 text-white">
                            <UtensilsCrossed className="size-5" />
                        </div>
                        <DialogTitle size="lg">Add Restaurant</DialogTitle>
                    </div>

                    {auth.isAuthenticated ? (
                        <RestaurantForm mode="add" onSuccess={handleSuccess} onCancel={handleCancel} />
                    ) : (
                        <div className="space-y-4 py-8 text-center">
                            <p className="text-stone-600">Please sign in to add restaurants.</p>
                            <Button
                                render={<Link to="/login" viewTransition />}
                                className="w-full"
                                nativeButton={false}
                            >
                                Sign In
                            </Button>
                        </div>
                    )}
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
