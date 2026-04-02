import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { authStore } from "./auth-store"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)

export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useUpdateRestaurant = () => createMutation(api.restaurants.update)
export const useAddFriend = () => createMutation(api.friends.add)

// Single auth hook for all auth state and actions
export const useAuth = () => authStore

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
