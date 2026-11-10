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
import type * as cors from "../cors.js";
import type * as email from "../email.js";
import type * as env from "../env.js";
import type * as friendships from "../friendships.js";
import type * as groups from "../groups.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as landing from "../landing.js";
import type * as migrate from "../migrate.js";
import type * as plans from "../plans.js";
import type * as restaurants from "../restaurants.js";
import type * as seed from "../seed.js";
import type * as shares from "../shares.js";
import type * as social from "../social.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as visibility from "../visibility.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cors: typeof cors;
  email: typeof email;
  env: typeof env;
  friendships: typeof friendships;
  groups: typeof groups;
  helpers: typeof helpers;
  http: typeof http;
  invitations: typeof invitations;
  landing: typeof landing;
  migrate: typeof migrate;
  plans: typeof plans;
  restaurants: typeof restaurants;
  seed: typeof seed;
  shares: typeof shares;
  social: typeof social;
  uploads: typeof uploads;
  users: typeof users;
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
