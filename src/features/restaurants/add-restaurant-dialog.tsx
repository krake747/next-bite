import { RestaurantDialog } from "./restaurant-dialog"

export function AddRestaurantDialog({
    show,
    onOpenChange,
}: Readonly<{ show: boolean; onOpenChange: (open: boolean) => void }>) {
    return <RestaurantDialog mode="add" show={show} onOpenChange={onOpenChange} />
}
