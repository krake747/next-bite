# TASK

For each branch below, push it to origin, create a pull request, and then merge the PR.

{{BRANCHES}}

# PROCESS

For each branch:

1. Push the branch: `git push origin <branch>`

2. Create a pull request using `gh pr create`:
   `gh pr create --base main --head <branch> --title "<title>" --body "<body>"`

   Use the issue ID as the PR title and include a brief summary in the body. Enable auto-merge if
   available.

3. Merge the pull request: `gh pr merge <branch> --squash --delete-branch`

   If the PR cannot be merged (e.g. conflicts), resolve them and then merge.

4. After merging, checkout main: `git checkout main && git pull origin main`

# UPDATE LINEAR ISSUES

For each merged branch, move its issue to Done:

`linear move <ID> "Done"`

Here are all the issues:

{{ISSUES}}

Once you have merged everything you can, output <promise>COMPLETE</promise>.
