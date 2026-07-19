import type { ChangeEvent } from "react"
import Search from "lucide-react/icons/search"
import X from "lucide-react/icons/x"
import { cx } from "@ui/variants"

type SearchInputProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function SearchInput({ value, onChange, placeholder, className, ...rest }: SearchInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.currentTarget.value)
    }

    const clearSearch = () => {
        onChange("")
    }

    return (
        <div className={cx("relative flex items-center", className)}>
            <Search className="pointer-events-none absolute left-0 size-4 text-neutral-400" />
            <input
                {...rest}
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder ?? "Search..."}
                className="w-full border-b border-neutral-200 bg-transparent py-1.5 pr-6 pl-6 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-flame-pea-500"
            />
            {value && (
                <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-0 flex size-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    )
}
