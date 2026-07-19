import { Dialog } from "@base-ui-components/react/dialog"
import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"
import { RestaurantForm } from "./restaurant-form"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

export function AddRestaurantDialog({ show, onOpenChange }: { show: boolean; onOpenChange: (open: boolean) => void }) {
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
                                Add Restaurant
                            </Dialog.Title>
                        </div>

                        {auth.isAuthenticated ? (
                            <RestaurantForm mode="add" onSuccess={handleSuccess} onCancel={handleCancel} />
                        ) : (
                            <div className="space-y-4 py-8 text-center">
                                <p className="text-neutral-600 dark:text-neutral-400">Please sign in to add restaurants.</p>
                                <Button as="a" href="/login" className="w-full">
                                    Sign In
                                </Button>
                            </div>
                        )}
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
