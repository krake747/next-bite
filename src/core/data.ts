import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Friend, Restaurant } from "./types"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)
export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useAddFriend = () => createMutation(api.friends.add)
