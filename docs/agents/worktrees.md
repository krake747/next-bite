# Worktrees

Read this when you create a worktree for a task.

Use one worktree per task. Run `herdr worktree create` when available.

When `herdr` is unavailable, create with explicit git steps from the repo root:

```bash
git fetch origin
git worktree add <home>/.herdr/worktrees/next-bite-<id> origin/main
git worktree list
```

Verify the new path shows in `git worktree list` before you start work.

Keep the original checkout on its branch so the main working copy never sits detached and later
pulls stay predictable.
