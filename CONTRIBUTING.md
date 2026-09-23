# Contributing to Synergy 27

`main` is the stable, demo-ready branch. Never edit or push directly to it.

## Start a change

1. Update `main`: `git checkout main` then `git pull origin main`.
2. Create one descriptive branch:
   - `feature/black-hole-polish`
   - `fix/mobile-navigation`
   - `content/2027-event-details`
   - `docs/deployment-guide`
3. Make and test the change locally.
4. Commit with a clear message, for example: `feat: add workshop detail modal`.
5. Push the branch and open a pull request into `main`.

## Pull-request rules

- Explain what changed and test it on desktop and mobile.
- Do not include secrets, `.env` files, or private participant data.
- One feature or fix per pull request.
- Merge only after one WebOps teammate reviews it.

## Commit prefixes

- `feat:` new visible feature
- `fix:` bug fix
- `docs:` documentation/content-only update
- `style:` visual-only change
- `chore:` maintenance
