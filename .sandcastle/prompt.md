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

# LINEAR INTEGRATION

Use these commands to interact with issues:

- `linear issues --label "agent-ready"` — list open issues tagged for agents
- `linear view LIN-123` — get full issue details including comments
- `linear comment LIN-123 "message"` — add a comment
- `linear move LIN-123 "In Progress"` — change issue status
- `linear states <team-id>` — list available workflow states

# WORKFLOW

1. Read the task description above.
2. Check if there's an issue number (e.g. KRA-51). If so, use `linear view` to pull in full details.
3. Create a branch for this work (e.g. `sandcastle/kra-51` or `sandcastle/fix-description`).
4. Explore the repo and fill your context window with relevant information.
5. Implement the task.
6. Run `pnpm lint` and `pnpm build` to verify correctness.
7. Commit your changes with a meaningful message.
8. Push the branch and create a PR with
   `gh pr create --title "..." --body "Closes <ISSUE>" --base main`.
9. (Optional) Use `linear comment` to summarize what was done.
10. (Optional) Use `linear move` to update the issue status.
11. Output <promise>COMPLETE</promise> when done.
