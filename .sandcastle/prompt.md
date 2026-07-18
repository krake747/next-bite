# TASK

{{TASK_DESCRIPTION}}

# CONTEXT

You are working on branch {{SOURCE_BRANCH}}. The target branch is {{TARGET_BRANCH}}.

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# PROJECT STANDARDS

This is a SolidJS web application built with TypeScript, Tailwind CSS v4, and Convex.

- Use `pnpm` as the package manager.
- Types are preferred over interfaces. Never cast types; fix at source instead.
- Do not add comments unless explicitly asked.
- Follow existing patterns in the codebase.

# WORKFLOW

1. Explore the repo and fill your context window with relevant information.
2. Implement the task.
3. Run `pnpm lint` and `pnpm build` to verify correctness.
4. Commit your changes.
5. Output <promise>COMPLETE</promise> when done.
