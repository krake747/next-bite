# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue details using `linear view {{TASK_ID}}`. If it references a parent issue or PRD,
pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Explore the repo and fill your context window with relevant information to complete the task.

Read relevant source files and existing tests before writing any code. Understand how similar code
is structured and tested.

# EXECUTION

Use RGR to complete the task:

1. RED: write a failing test
2. GREEN: write the minimal implementation to pass the test
3. REPEAT until the task is done
4. REFACTOR: clean up the code

# PROJECT STANDARDS

This is a SolidJS web application built with TypeScript, Tailwind CSS v4, and Convex.

- Use `pnpm` as the package manager.
- Types over interfaces. Never cast types; fix at source instead.
- Do not add comments unless explicitly asked.
- Follow existing patterns in the codebase.

# FEEDBACK LOOPS

Before committing, run:

- `pnpm lint`
- `pnpm build`

Fix any failures before proceeding.

# COMMIT

Make a git commit. The commit message must:

1. Start with `[RALPH]` prefix
2. Include the task ID and title
3. List key decisions made
4. List files changed
5. Note any blockers

Keep it concise.

Push your branch to origin: `git push origin {{BRANCH}}`. If the push fails, you must fix the issue
before completing. Do NOT mark the task complete if the branch cannot be pushed.

# THE ISSUE

If the task is not complete, use `linear comment {{TASK_ID}} "..."` to note what was done.

Move the issue to "In Review" with `linear move {{TASK_ID}} "In Review"`.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
