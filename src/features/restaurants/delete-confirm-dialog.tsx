import { Button } from "@ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@ui/dialog"
import { DialogClose } from "@ui/dialog"

export function DeleteConfirmDialog({
    show,
    onOpenChange,
    onConfirm,
    restaurantName,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    restaurantName: string
}>) {
    return (
        <Dialog open={show} onOpenChange={onOpenChange}>
            <DialogContent size="sm" showCloseButton={false}>
                <DialogTitle>Delete restaurant</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <strong className="text-foreground">{restaurantName}</strong>? This
                    action cannot be undone.
                </DialogDescription>
                <DialogFooter className="mt-6">
                    <DialogClose
                        render={
                            <Button tone="secondary" size="md">
                                Cancel
                            </Button>
                        }
                    />
                    <Button
                        tone="destructive"
                        size="md"
                        onClick={() => {
                            onConfirm()
                            onOpenChange(false)
                        }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
