import { Dialog } from "@base-ui/react/dialog"
import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth, type Restaurant } from "@core/hooks"

import { RestaurantForm } from "./restaurant-form"

export function EditRestaurantDialog({
    show,
    onOpenChange,
    restaurant,
}: {
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurant: Restaurant
}) {
    const auth = useAuth()
    const handleSuccess = () => onOpenChange(false)
    const handleCancel = () => onOpenChange(false)

    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white dark:from-flame-pea-600 dark:to-flame-pea-700">
                                <UtensilsCrossed className="size-5" />
                            </div>
                            <Dialog.Title
                                className="text-xl font-semibold text-neutral-900 dark:text-white"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                Edit Restaurant
                            </Dialog.Title>
                        </div>
                        {auth.isAuthenticated ? (
                            <RestaurantForm
                                mode="edit"
                                restaurant={restaurant}
                                onSuccess={handleSuccess}
                                onCancel={handleCancel}
                            />
                        ) : (
                            <div className="space-y-4 py-8 text-center">
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Please sign in to edit restaurants.
                                </p>
                                <Link
                                    to="/login"
                                    viewTransition
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-x-1.5 rounded-md bg-flame-pea-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-flame-pea-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-700 active:scale-[0.97] dark:bg-flame-pea-800 dark:text-white dark:shadow-none dark:hover:bg-flame-pea-700 dark:focus-visible:outline-flame-pea-50"
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
