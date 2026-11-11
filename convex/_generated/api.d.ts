/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as env from "../env.js";
import type * as groups from "../groups.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as interests from "../interests.js";
import type * as invites from "../invites.js";
import type * as model_groups_groups from "../model/groups/groups.js";
import type * as model_groups_invites from "../model/groups/invites.js";
import type * as model_groups_memberships from "../model/groups/memberships.js";
import type * as model_identity_profiles from "../model/identity/profiles.js";
import type * as model_places_images from "../model/places/images.js";
import type * as model_social_friendships from "../model/social/friendships.js";
import type * as plans from "../plans.js";
import type * as restaurants from "../restaurants.js";
import type * as seed from "../seed.js";
import type * as shares from "../shares.js";
import type * as social from "../social.js";
import type * as storage from "../storage.js";
import type * as validators from "../validators.js";
import type * as visibility from "../visibility.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  email: typeof email;
  env: typeof env;
  groups: typeof groups;
  helpers: typeof helpers;
  http: typeof http;
  identity: typeof identity;
  interests: typeof interests;
  invites: typeof invites;
  "model/groups/groups": typeof model_groups_groups;
  "model/groups/invites": typeof model_groups_invites;
  "model/groups/memberships": typeof model_groups_memberships;
  "model/identity/profiles": typeof model_identity_profiles;
  "model/places/images": typeof model_places_images;
  "model/social/friendships": typeof model_social_friendships;
  plans: typeof plans;
  restaurants: typeof restaurants;
  seed: typeof seed;
  shares: typeof shares;
  social: typeof social;
  storage: typeof storage;
  validators: typeof validators;
  visibility: typeof visibility;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
