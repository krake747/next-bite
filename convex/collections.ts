import { type GenericDatabaseReader } from "convex/server"
import { v } from "convex/values"

import { type DataModel } from "./_generated/dataModel"
import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { requireMembership } from "./groups"
import { requireUserId } from "./helpers"
import { isRestaurantVisibleTo } from "./shares"

type CollectionRow = Doc<"collections">

async function requireCollectionAccess(
    db: GenericDatabaseReader<DataModel>,
    collection: CollectionRow,
    userId: string,
): Promise<void> {
    if (collection.ownerId === userId) {
        return
    }
    if (collection.groupId === undefined) {
        throw new Error("Unauthorized: only the owner can change this collection")
    }
    await requireMembership(db, collection.groupId, userId)
}

async function readCollection(
    db: GenericDatabaseReader<DataModel>,
    collectionId: Id<"collections">,
): Promise<CollectionRow> {
    const collection = await db.get(collectionId)
    if (!collection) {
        throw new Error("Collection not found")
    }
    return collection
}

export const createCollection = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        groupId: v.optional(v.id("groups")),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const name = args.name.trim()
        if (name === "") {
            throw new Error("Collection name is required")
        }
        if (args.groupId !== undefined) {
            await requireMembership(ctx.db, args.groupId, userId)
        }
        return ctx.db.insert("collections", {
            ownerId: userId,
            name,
            description: args.description,
            ...(args.groupId !== undefined ? { groupId: args.groupId } : {}),
            createdAt: Date.now(),
        })
    },
})

export const addItem = mutation({
    args: {
        collectionId: v.id("collections"),
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const collection = await readCollection(ctx.db, args.collectionId)
        await requireCollectionAccess(ctx.db, collection, userId)
        const restaurant = await ctx.db.get(args.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }
        const visible = await isRestaurantVisibleTo(ctx.db, userId, restaurant)
        if (!visible) {
            throw new Error("Unauthorized: restaurant is not shared with you")
        }
        const items = await ctx.db
            .query("collectionItems")
            .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
            .collect()
        const existing = items.find((item) => item.restaurantId === args.restaurantId)
        if (existing) {
            return existing._id
        }
        return ctx.db.insert("collectionItems", {
            collectionId: args.collectionId,
            restaurantId: args.restaurantId,
            addedBy: userId,
            addedAt: Date.now(),
        })
    },
})

export const removeItem = mutation({
    args: {
        collectionId: v.id("collections"),
        restaurantId: v.id("restaurants"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const collection = await readCollection(ctx.db, args.collectionId)
        await requireCollectionAccess(ctx.db, collection, userId)
        const items = await ctx.db
            .query("collectionItems")
            .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
            .collect()
        const match = items.find((item) => item.restaurantId === args.restaurantId)
        if (!match) {
            throw new Error("Restaurant is not in this collection")
        }
        await ctx.db.delete(match._id)
        return match._id
    },
})

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx)
        return ctx.db
            .query("collections")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .collect()
    },
})

export const listForGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        await requireMembership(ctx.db, args.groupId, userId)
        return ctx.db
            .query("collections")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect()
    },
})

export const listItems = query({
    args: {
        collectionId: v.id("collections"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const collection = await readCollection(ctx.db, args.collectionId)
        await requireCollectionAccess(ctx.db, collection, userId)
        const items = await ctx.db
            .query("collectionItems")
            .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
            .collect()
        const entries: { item: (typeof items)[number]; restaurant: Doc<"restaurants"> }[] = []
        for (const item of items) {
            const restaurant = await ctx.db.get(item.restaurantId)
            if (!restaurant) {
                continue
            }
            const visible = await isRestaurantVisibleTo(ctx.db, userId, restaurant)
            if (visible) {
                entries.push({ item, restaurant })
            }
        }
        return entries
    },
})
