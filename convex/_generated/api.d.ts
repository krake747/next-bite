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
import type * as invites from "../invites.js";
import type * as model_groups_groups from "../model/groups/groups.js";
import type * as model_groups_invites from "../model/groups/invites.js";
import type * as model_groups_memberships from "../model/groups/memberships.js";
import type * as model_identity_profiles from "../model/identity/profiles.js";
import type * as model_places_hours from "../model/places/hours.js";
import type * as model_places_photos from "../model/places/photos.js";
import type * as model_places_places from "../model/places/places.js";
import type * as model_plans_plans from "../model/plans/plans.js";
import type * as model_social_friendships from "../model/social/friendships.js";
import type * as places from "../places.js";
import type * as plans from "../plans.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as storage from "../storage.js";
import type * as validators from "../validators.js";

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
  invites: typeof invites;
  "model/groups/groups": typeof model_groups_groups;
  "model/groups/invites": typeof model_groups_invites;
  "model/groups/memberships": typeof model_groups_memberships;
  "model/identity/profiles": typeof model_identity_profiles;
  "model/places/hours": typeof model_places_hours;
  "model/places/photos": typeof model_places_photos;
  "model/places/places": typeof model_places_places;
  "model/plans/plans": typeof model_plans_plans;
  "model/social/friendships": typeof model_social_friendships;
  places: typeof places;
  plans: typeof plans;
  seed: typeof seed;
  social: typeof social;
  storage: typeof storage;
  validators: typeof validators;
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
