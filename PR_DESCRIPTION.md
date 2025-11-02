# fix: Add .nojekyll file to resolve GitHub Pages 404 errors on credential details

## Problem

The credential details page (`/identifier/[encoded-id]/`) returns 404 errors on the bcgov GitHub Pages site (https://bcgov.github.io/aries-oca-explorer/), while the same functionality works correctly in the fork (https://krobinsonca.github.io/aries-oca-explorer/).

## Root Cause

The main repository was missing a `.nojekyll` file in the `public/` directory. Without this file, GitHub Pages defaults to processing the site with Jekyll, which:

- **Ignores directories starting with underscore** (e.g., `_next` directory required by Next.js)
- **Mishandles encoded URLs** - Credential IDs contain special characters (`:`, `/`) that are URL-encoded (e.g., `%3A`, `%2F`), and Jekyll doesn't handle these paths correctly
- **Breaks static export routing** - With `trailingSlash: true`, Next.js generates `identifier/[id]/index.html`, but Jekyll routing breaks these paths

## Evidence

### Comparison Results:
- **bcgov/aries-oca-explorer**: Was missing `public/.nojekyll` → **404 errors** on credential detail routes
- **krobinsonca/aries-oca-explorer**: Has `public/.nojekyll` → **Works correctly**

### Example Failing Route:
- `https://bcgov.github.io/aries-oca-explorer/identifier/4WW6792ksq62UroZyfd6nQ%3A3%3ACL%3A1098%3ASpecialEventServer/` → 404

### Example Working Route (in fork):
- `https://krobinsonca.github.io/aries-oca-explorer/identifier/4WW6792ksq62UroZyfd6nQ%3A3%3ACL%3A1098%3ASpecialEventServer/` → Loads successfully

## Solution

Added an empty `.nojekyll` file to the `public/` directory. This file:
1. Is automatically copied by Next.js to the `out/` directory during build (verified)
2. Instructs GitHub Pages to bypass Jekyll processing
3. Ensures all static files (including `_next/`) are served correctly
4. Preserves encoded URL routing for credential detail pages

## Changes

- ✅ Added `public/.nojekyll` (empty file)
- ✅ Verified Next.js copies it to `out/` during build
- ✅ Workflow correctly uploads `out/` directory which includes `.nojekyll`

## Technical Details

- **Build Process**: Next.js `output: 'export'` automatically copies all files from `public/` to `out/` during static export, including dotfiles like `.nojekyll`
- **GitHub Actions**: The workflow uses `actions/configure-pages@v5` with `static_site_generator: next`, which handles GitHub Pages configuration automatically
- **Deployment**: The `out/` directory (containing `.nojekyll`) is uploaded as an artifact and deployed to GitHub Pages

## Testing

After deployment, verify:
- [x] `.nojekyll` file exists in repository (`public/.nojekyll`)
- [x] `.nojekyll` file is copied to build output (`out/.nojekyll`)
- [x] Workflow correctly uploads `out/` directory
- [ ] Credential detail pages load without 404 errors (pending deployment)
- [ ] Home page and listing pages continue to work
- [ ] Navigation to credential details from the filter page works
- [ ] Direct URL access to credential detail pages works

## Related

- Previous PR #53: Added `.nojekyll` file to `public/` directory
- Discussion with @swcurran about Jekyll processing issues
- Verified working implementation in fork: `krobinsonca/aries-oca-explorer`

## DCO

- [x] I have read the DCO document and I hereby sign the commit
