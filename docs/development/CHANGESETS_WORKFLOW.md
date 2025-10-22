# Changesets Release Workflow

Template Doctor now uses **changesets** for version management and releases. This provides better control and transparency compared to release-please.

## Quick Start

### 1. Making Changes

When you make changes that should be included in a release:

```bash
npm run changeset
```

This will:
- Ask what type of change (major/minor/patch)
- Ask for a description
- Create a changeset file in `.changeset/`

### 2. Commit the Changeset

```bash
git add .changeset/
git commit -m "feat: your feature description"
```

### 3. Release Process

When ready to release, the GitHub Action will:
1. Automatically create a "Version Packages" PR
2. The PR will update versions and CHANGELOG.md
3. Merge the PR to trigger the release
4. Publish to GitHub releases

## Manual Release (if needed)

```bash
# Update versions and CHANGELOG
npm run changeset:version

# Commit the version changes
git add .
git commit -m "chore: version packages"

# Create git tag and push
git tag v2.3.0
git push origin main --tags

# Create GitHub release manually or let CI do it
```

## Common Commands

- `npm run changeset` - Add a new changeset
- `npm run changeset:version` - Consume changesets and bump versions
- `npm run changeset:publish` - Publish packages (GitHub release)

## Benefits Over release-please

✅ **Explicit control**: You decide what changes go in each release
✅ **Clear history**: Changesets are committed with your changes
✅ **No version confusion**: Manual control prevents miscalculation
✅ **Better monorepo support**: Works great with workspaces
✅ **Intuitive workflow**: Simple CLI, easy to understand

## Examples

### Patch Release (Bug Fix)
```bash
npm run changeset
# Select: patch
# Description: "Fix XSS vulnerability in search"
```

### Minor Release (New Feature)
```bash
npm run changeset
# Select: minor
# Description: "Add new OAuth authentication"
```

### Major Release (Breaking Change)
```bash
npm run changeset
# Select: major
# Description: "Migrate to Express from Azure Functions"
```

## Tips

- Create changesets in the same PR as your changes
- Multiple changesets can exist before a release
- Changesets accumulate until you run `changeset:version`
- The GitHub Action automates the version PR creation
- You control when releases happen by merging the Version PR
