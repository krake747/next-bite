# Plans

Product term: Plan. Defined in `GLOSSARY.md`.

## Routes

Plans have no standalone route. `PlanSection` renders inside `src/routes/_app/groups.$groupId.tsx`
for a group and inside `src/routes/_app/restaurants.$restaurantId.tsx` for a restaurant.

## UI (`src/features/plans/`)

- `plans.tsx`: `PlanSection` proposes a dated outing with a title and a date, and marks plans done
  or cancelled. Participant names render from the plan rows.

## Core (`src/core/`)

- `plans.ts`: `useCreatePlan`, `usePlansForGroup`, `usePlansForRestaurant`, and
  `useUpdatePlanStatus`.

## Backend (`convex/`)

- `plans.ts`: `createPlan`, `listPlansForGroup`, `listPlansForRestaurant`, and `updatePlanStatus`.
  Status values live in the schema fragment.

## Data (`convex/model/plans/schema.ts`)

Tables `plans` and `planParticipants`.

## Decisions

- `docs/architecture.md`: data flow section. Convex owns authorization; the client only renders.

## Tests

- `src/core/plans.integration.spec.ts`

## State

Shipped: propose a dated outing per group or restaurant, list plans, mark them done or cancelled.
Partial: participant rules live in `convex/plans.ts`; read that file before changing them. Out of
scope of the current code: plans do not reference shares, and nothing in the code derives a plan
from group interest.
