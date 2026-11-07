import { useState } from "react"

export function useFilterState() {
    const [filter, setFilter] = useState("")
    const [search, setSearch] = useState("")

    return {
        filter,
        setFilter,
        search,
        setSearch,
    }
}
