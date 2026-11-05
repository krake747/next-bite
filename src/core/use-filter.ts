import { useState } from "react"

export function useFilterState(initial: string | null = null) {
    const [filter, setFilter] = useState<string | null>(initial)
    const [search, setSearch] = useState("")

    const filtered = <T>(items: ReadonlyArray<T>, getName: (item: Readonly<T>) => string): T[] => {
        let result = filter !== null && filter !== "" ? items.filter((x) => getName(x) === filter) : [...items]
        const searchTerm = search.trim().toLowerCase()
        if (searchTerm) {
            result = result.filter((x) => getName(x).toLowerCase().includes(searchTerm))
        }
        return result
    }

    const hasActive = filter !== null || search.trim() !== ""

    const clear = () => {
        setFilter(null)
        setSearch("")
    }

    return {
        filter,
        setFilter,
        search,
        setSearch,
        filtered,
        hasActive,
        clear,
    }
}
