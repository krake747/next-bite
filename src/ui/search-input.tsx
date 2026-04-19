import { splitProps } from "solid-js"
import Search from "lucide-solid/icons/search"
import X from "lucide-solid/icons/x"
import { cx } from "@ui/variants"

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
            <Search class="pointer-events-none absolute left-0 size-4 text-neutral-400" />
            <input
                {...local}
                type="text"
                value={props.value}
                onInput={handleInput}
                placeholder={props.placeholder ?? "Search..."}
                class="w-full border-b border-neutral-200 bg-transparent py-1.5 pr-6 pl-6 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-flame-pea-500"
            />
            {props.value && (
                <button
                    type="button"
                    onClick={clearSearch}
                    class="absolute right-0 flex size-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    aria-label="Clear search"
                >
                    <X class="size-3.5" />
                </button>
            )}
        </div>
    )
}
