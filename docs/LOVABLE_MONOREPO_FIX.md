# Lovable Monorepo Compatibility Fix

## Problem

Lovable expects these files at the repository root:
- `index.html`
- `vite.config.ts`
- `package-lock.json` (or equivalent)

But Vyberology uses a **Turborepo monorepo** structure where these files are nested in `apps/web/`.

## Solution: Symlinks

Create symlinks at the root that point to the actual files in `apps/web/`.

### Commands to Run:

```bash
cd /path/to/Vyberology-main-27.10.25

# Create symlinks to web app files
ln -s apps/web/index.html index.html
ln -s apps/web/vite.config.ts vite.config.ts

# Note: No package-lock.json because we use pnpm (pnpm-lock.yaml exists)
```

### Verify:

```bash
ls -la | grep "^l"  # List symlinks
```

Expected output:
```
lrwxr-xr-x  1 user  staff   22 Oct 28 06:45 index.html -> apps/web/index.html
lrwxr-xr-x  1 user  staff   26 Oct 28 06:45 vite.config.ts -> apps/web/vite.config.ts
```

## What This Fixes

✅ Lovable can find `index.html` at root
✅ Lovable can find `vite.config.ts` at root
✅ `build:dev` script exists in both root and `apps/web`
✅ Lovable build should work

## Important Notes

1. **Git tracking**: Symlinks are tracked in git, so once committed, everyone gets them
2. **Cross-platform**: Symlinks work on macOS/Linux. Windows may need special handling
3. **Alternative**: Could use file copies, but symlinks keep single source of truth

## If Build Still Fails

Lovable may need additional configuration. Contact Lovable support with:
- Repo structure: Turborepo monorepo
- Build tool: Vite
- Package manager: pnpm
- Workspace: `apps/web/`

## Verification Steps

After creating symlinks and committing:

1. **Local test**:
   ```bash
   pnpm build:dev
   ```

2. **Check Lovable**: Try rebuilding in Lovable interface

3. **Verify deployment**: Check if preview deploys work

## Rollback

If symlinks cause issues:
```bash
rm index.html vite.config.ts
git checkout index.html vite.config.ts  # If they existed before
git rm index.html vite.config.ts        # If they didn't exist
```

---

**Status**: Ready to create symlinks
**Next Step**: Run the commands above, commit, and test with Lovable
