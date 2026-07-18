# TASK

Merge the following branches into the current branch:

{{BRANCHES}}

For each branch:

1. Run `git merge <branch> --no-edit`
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the
   correct resolution
3. After resolving conflicts, run `pnpm lint` and `pnpm build` to verify everything works
4. If builds fail, fix the issues before proceeding to the next branch

After all branches are merged, make a single commit summarizing the merge.

# UPDATE LINEAR ISSUES

For each merged branch, move its issue to Done:

`linear move <ID> "Done"`

Here are all the issues:

{{ISSUES}}

Once you have merged everything you can, output <promise>COMPLETE</promise>.
