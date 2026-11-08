import { PlusIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { Button } from "@ui/button"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "@ui/dialog"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui/tabs"

import { Demo } from "./demo-frame"

export const overlaysMeta = {
    id: "overlays",
    group: "Overlay",
    title: "Dialogs, popovers, and tabs",
    body: "Light overlays with managed focus. Open the dialog and popover to inspect backdrop, panel, and close behavior.",
    importPath: "@ui/dialog · @ui/popover · @ui/tabs",
    anatomy: [
        { element: "Trigger", description: "Opens the overlay." },
        { element: "Panel", description: "The overlay content." },
        { element: "Backdrop", description: "Dims the page behind dialogs." },
    ],
    children: [
        { id: "dialog", title: "Dialog" },
        { id: "popover", title: "Popover" },
        { id: "tabs", title: "Tabs" },
    ],
} as const

export function OverlaysDemo() {
    const [showDialog, setShowDialog] = useState(false)
    return (
        <Demo className="space-y-6">
            <div id="dialog" role="group" aria-label="Dialog" className="flex flex-wrap items-center gap-3">
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
                            <p className="mt-2 text-sm text-pretty text-muted-foreground">
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
            </div>
            <div id="popover" role="group" aria-label="Popover" className="flex flex-wrap items-center gap-3">
                <Popover>
                    <PopoverTrigger tone="tinted" className="size-8" aria-label="Open menu">
                        <PlusIcon className="size-4" aria-hidden="true" />
                    </PopoverTrigger>
                    <PopoverPanel className="w-48">
                        <p className="px-3 py-2 text-sm text-foreground">Your menu content</p>
                    </PopoverPanel>
                </Popover>
            </div>
            <div id="tabs" role="group" aria-label="Tabs" className="w-full max-w-sm">
                <Tabs defaultValue="discover">
                    <TabsList>
                        <TabsTab value="discover">Discover</TabsTab>
                        <TabsTab value="saved">Saved</TabsTab>
                    </TabsList>
                    <TabsPanel value="discover">Discovery content</TabsPanel>
                    <TabsPanel value="saved">Saved content</TabsPanel>
                </Tabs>
            </div>
        </Demo>
    )
}
