import { Dialog } from "@base-ui/react/dialog"
import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth } from "@core/hooks"

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
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200/60 bg-background/95 p-6 shadow-popover backdrop-blur-md">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-tomato-500 to-tomato-600 text-white">
                                <UtensilsCrossed className="size-5" />
                            </div>
                            <Dialog.Title
                                className="text-xl font-semibold text-stone-900"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                Add Restaurant
                            </Dialog.Title>
                        </div>

                        {auth.isAuthenticated ? (
                            <RestaurantForm mode="add" onSuccess={handleSuccess} onCancel={handleCancel} />
                        ) : (
                            <div className="space-y-4 py-8 text-center">
                                <p className="text-stone-600">Please sign in to add restaurants.</p>
                                <Link
                                    to="/login"
                                    viewTransition
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-x-1.5 rounded-md bg-tomato-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-tomato-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato-700 active:scale-[0.97]"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
