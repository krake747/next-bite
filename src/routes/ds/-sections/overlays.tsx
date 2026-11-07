import { useState } from "react"

import { Button } from "@ui/button"
import { Card } from "@ui/card"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "@ui/dialog"
import { Popover, PopoverTrigger, PopoverPanel } from "@ui/popover"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@ui/tabs"

export const overlaysMeta = {
    id: "overlays",
    group: "Overlay",
    title: "Dialogs, popovers, and tabs",
    body: "Light overlays with managed focus. Open the dialog and popover to inspect backdrop, panel, and close behavior.",
} as const

export function OverlaysDemo() {
    const [showDialog, setShowDialog] = useState(false)
    return (
        <Card>
            <div className="flex flex-wrap items-center gap-3 p-5">
                <Button
                    tone="secondary"
                    onClick={() => {
                        setShowDialog(true)
                    }}
                >
                    Open dialog
                </Button>
                <Dialog show={showDialog} onOpenChange={setShowDialog}>
                    <DialogBackdrop>
                        <DialogPanel size="sm">
                            <DialogTitle>Example dialog</DialogTitle>
                            <p className="mt-2 text-sm text-pretty text-stone-600">
                                Backdrop, panel, title, and close button from the shared wrapper.
                            </p>
                            <DialogCloseButton
                                onClick={() => {
                                    setShowDialog(false)
                                }}
                            />
                        </DialogPanel>
                    </DialogBackdrop>
                </Dialog>
                <Popover>
                    <PopoverTrigger tone="tinted" className="size-8">
                        +
                    </PopoverTrigger>
                    <PopoverPanel className="w-48">
                        <p className="px-3 py-2 text-sm text-stone-700">Your menu content</p>
                    </PopoverPanel>
                </Popover>
                <div className="w-full max-w-sm">
                    <Tabs defaultValue="discover">
                        <TabsList>
                            <TabsTab value="discover">Discover</TabsTab>
                            <TabsTab value="saved">Saved</TabsTab>
                        </TabsList>
                        <TabsPanel value="discover">Discovery content</TabsPanel>
                        <TabsPanel value="saved">Saved content</TabsPanel>
                    </Tabs>
                </div>
            </div>
        </Card>
    )
}
