import { For } from "solid-js"
import { LazyImage } from "@ui/lazy-image"

export function GalleryGrid(props: { images: string[]; onSelect: (index: number) => void }) {
    return (
        <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                <For each={props.images}>
                    {(imageUrl, index) => (
                        <button
                            type="button"
                            onClick={() => props.onSelect(index())}
                            class="group relative aspect-square overflow-hidden rounded-lg"
                        >
                            <LazyImage
                                src={imageUrl}
                                alt={`Image ${index() + 1}`}
                                aspectRatio="1"
                                class="transition-transform duration-200 ease-out group-hover:scale-105"
                            />
                        </button>
                    )}
                </For>
            </div>
        </div>
    )
}
