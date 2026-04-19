import { Show } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"
import { RestaurantForm } from "./restaurant-form"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"

export function AddRestaurantDialog(props: { show: boolean; onOpenChange: (open: boolean) => void }) {
    const auth = useAuth()

    const handleSuccess = () => {
        props.onOpenChange(false)
    }

    const handleCancel = () => {
        props.onOpenChange(false)
    }

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Content class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <div class="mb-6 flex items-center gap-3">
                            <div class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white dark:from-flame-pea-600 dark:to-flame-pea-700">
                                <UtensilsCrossed class="size-5" />
                            </div>
                            <Dialog.Title
                                class="text-xl font-semibold text-neutral-900 dark:text-white"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                Add Restaurant
                            </Dialog.Title>
                        </div>

                        <Show
                            when={auth.isAuthenticated()}
                            fallback={
                                <div class="space-y-4 py-8 text-center">
                                    <p class="text-neutral-600 dark:text-neutral-400">
                                        Please sign in to add restaurants.
                                    </p>
                                    <Button as="a" href="/login" class="w-full">
                                        Sign In
                                    </Button>
                                </div>
                            }
                        >
                            <RestaurantForm mode="add" onSuccess={handleSuccess} onCancel={handleCancel} />
                        </Show>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
