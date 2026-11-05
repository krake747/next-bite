import Search from "lucide-react/icons/search"
import X from "lucide-react/icons/x"

import { cx } from "@ui/variants"

type SearchInputProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string | undefined
    className?: string | undefined
}

export function SearchInput({ value, onChange, placeholder, className, ...rest }: Readonly<SearchInputProps>) {
    const handleChange = (e: Readonly<{ readonly currentTarget: Readonly<{ readonly value: string }> }>) => {
        onChange(e.currentTarget.value)
    }

    const clearSearch = () => {
        onChange("")
    }

    return (
        <div className={cx("relative flex items-center", className)}>
            <Search className="pointer-events-none absolute left-0 size-4 text-stone-400" aria-hidden="true" />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder ?? "Search…"}
                className="w-full border-b border-border bg-transparent py-1.5 pr-12 pl-6 text-sm text-stone-900 transition-colors duration-150 placeholder:text-stone-400 hover:border-border-strong focus:border-ring focus:outline-none"
                {...rest}
            />
            {value && (
                <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-0 flex min-h-11 min-w-11 items-center justify-center rounded-full text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}
