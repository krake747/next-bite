import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

export const useRestaurants = () => {
    const restaurants = createQuery<Restaurant[]>(api.restaurants.get)
    return () => restaurants() ?? []
}

export const useFriends = () => {
    const friends = createQuery<Friend[]>(api.friends.get)
    return () => friends() ?? []
}

export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useUpdateRestaurant = () => createMutation(api.restaurants.update)
export const useAddFriend = () => createMutation(api.friends.add)

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
