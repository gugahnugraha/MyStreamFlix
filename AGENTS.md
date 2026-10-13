# Project Guidelines & Agent Instructions

## Always Deploy to Vercel
- Whenever any code modifications, fixes, or new features are completed and verified:
  1. Ensure TypeScript compilation passes (`npx tsc --noEmit`).
  2. Stage and commit the changes with a clear conventional commit message.
  3. Push the commits to `origin main` (`git push origin main`).
- The repository is connected to Vercel via GitHub integration (`gugahnugraha/MyStreamFlix`), which automatically triggers production deployment to `mystreamflix.biz.id` on every push to `main`.
