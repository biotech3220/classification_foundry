Sync local main and staging branches with remote before starting work

## Steps

1. Fetch all remote branches:
   ```
   git fetch origin
   ```

2. Stash any uncommitted changes if needed:
   - Check `git status` for uncommitted changes
   - If changes exist, stash them: `git stash push -m "WIP before sync"`

3. Update main branch:
   ```
   git checkout main
   git pull origin main
   ```

4. Update staging branch:
   ```
   git checkout staging
   git pull origin staging
   ```

5. Return to the original branch and restore stash if one was created

6. Rebase current branch on staging (if the current branch is NOT main or staging):
   - Run `git rebase staging`
   - This ensures the working branch has all the latest changes from staging
   - If rebase conflicts occur, abort with `git rebase --abort` and inform the user

7. Show a summary report:
   - Current branch
   - main: synced or not
   - staging: synced or not
   - Whether the current branch was rebased on staging
   - Whether stash was restored
   - Any issues encountered

8. If any step failed (merge conflicts, rebase conflicts, etc.), report the issue clearly and do NOT force reset without user confirmation
