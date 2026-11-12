# Plans

Product term: Plan. Defined in `GLOSSARY.md`.

## Routes

Plans have no standalone route. `PlanSection` renders inside `src/routes/_app/groups.$groupId.tsx`
for a group. The restaurant detail route has no plan section; restaurant-scoped plans are gone.

## UI (`src/features/plans/`)

- `plans.tsx`: `PlanSection` proposes an outing at one of the group's shared places with a date, and
  the organizer or group owner cancels it. Organizer names render from the plan rows.

## Core (`src/core/`)

- `plans.ts`: `useCreatePlan`, `usePlansForGroup`, and `useCancelPlan`.

## Backend (`convex/`)

- `plans.ts`: `forGroup`, `create`, and `cancel`, backed by `convex/model/plans/`. Members are the
  participants; acceptance is membership plus a group-held place. Status values live in the schema
  fragment.

## Data (`convex/model/plans/schema.ts`)

Table `plans`. See the schema fragment for fields and indexes.

## Decisions

- `docs/architecture.md`: data flow section. Convex owns authorization; the client only renders.

## Tests

- `src/core/plans.integration.spec.ts`
