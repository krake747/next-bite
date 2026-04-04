import { splitProps } from "solid-js"
import Search from "lucide-solid/icons/search"
import X from "lucide-solid/icons/x"
import { cx } from "./variants"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    class?: string
}

export function SearchInput(props: SearchInputProps) {
    const [, local] = splitProps(props, ["value", "onChange", "placeholder", "class"])

    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
        props.onChange(e.currentTarget.value)
    }

    const clearSearch = () => {
        props.onChange("")
    }

    return (
        <div class={cx("relative flex items-center", props.class)}>
            <Search class="pointer-events-none absolute left-2.5 size-4 text-neutral-400" />
            <input
                {...local}
                type="text"
                value={props.value}
                onInput={handleInput}
                placeholder={props.placeholder ?? "Search..."}
                class="w-full rounded border border-neutral-200 bg-white py-1.5 pr-8 pl-9 text-sm ring-flame-pea-300 transition-all outline-none focus:border-flame-pea-400 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
            {props.value && (
                <button
                    onClick={clearSearch}
                    class="absolute right-2 rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-600 dark:hover:text-neutral-300"
                    aria-label="Clear search"
                    type="button"
                >
                    <X class="size-4" />
                </button>
            )}
        </div>
    )
}
