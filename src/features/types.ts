export type Restaurant = {
    id: string
    name: string
    cuisine: string
    location: string
    notes?: string
    addedBy: string
    visited: boolean
    createdAt: Date
}

export type Friend = {
    id: string
    name: string
}
