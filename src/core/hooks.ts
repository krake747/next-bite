import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)
export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useAddFriend = () => createMutation(api.friends.add)

export type Restaurant = {
    _id: string
    name: string
    cuisine: string
    location: string
    notes?: string
    addedBy: string
}

export type Friend = {
    _id: string
    name: string
}
