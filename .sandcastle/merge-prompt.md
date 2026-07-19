# TASK

For each branch below, push it to origin, create a pull request, and then merge the PR.

{{BRANCHES}}

# PROCESS

For each branch:

1. Checkout main and pull latest: `git checkout main && git pull origin main`

2. Checkout the branch: `git checkout <branch>`

3. Rebase on main: `git rebase main` If conflicts occur, resolve them, then `git rebase --continue`.

4. Force-push the updated branch: `git push origin <branch> --force-with-lease`

5. Create a pull request using `gh pr create`:
   `gh pr create --base main --head <branch> --title "<title>" --body "<body>"`

   Use the issue ID as the PR title and include a brief summary in the body. Enable auto-merge if
   available.

6. Merge the pull request: `gh pr merge <branch> --squash --delete-branch`

   If the PR cannot be merged (e.g. conflicts), resolve them and then merge.

7. After merging, checkout main: `git checkout main && git pull origin main`

# UPDATE LINEAR ISSUES

For each merged branch, move its issue to Done:

`linear move <ID> "Done"`

Here are all the issues:

{{ISSUES}}

Once you have merged everything you can, output <promise>COMPLETE</promise>.
