# Console.log Cleanup - Implementation Plan

## Status: Logger Created ✅, Replacements Pending

### Completed (Commit 157739c)
- ✅ Created `packages/app/src/utils/logger.ts` - Environment-aware logging
- ✅ Development mode: All logs visible (debug, info, warn, error)
- ✅ Production mode: Only errors logged
- ✅ Comprehensive tests (6/6 passing)
- ✅ Build verified working

### Remaining Work
**391 console statements** across **60+ TypeScript files** need replacement

### Top Priority Files (by console statement count)
1. `search.ts` - 64 statements
2. `issue-service.ts` - 45 statements
3. `ruleset-modal.ts` - 40 statements
4. `auth.ts` - 40 statements
5. `dashboard-renderer.ts` - 32 statements
6. `analyzer.ts` - 31 statements
7. `agents-enrichment.ts` - 19 statements
8. `azd-validation.ts` - 18 statements
9. `template-list.ts` - 15 statements
10. `runtime-config.ts` - 15 statements

### Systematic Replacement Approach

#### For each file:
1. Add logger import:
   ```typescript
   import { logger } from '../utils/logger.js';
   ```

2. Replace patterns:
   ```typescript
   // OLD: console.log('[ModuleName]', message, ...data)
   // NEW: logger.info('module-name', message, ...data)
   
   // OLD: console.debug('[ModuleName]', message)
   // NEW: logger.debug('module-name', message)
   
   // OLD: console.warn('[ModuleName]', message)
   // NEW: logger.warn('module-name', message)
   
   // OLD: console.error('[ModuleName]', error)
   // NEW: logger.error('module-name', 'Error description', error)
   ```

3. Module name conventions:
   - File: `src/scripts/search.ts` → Module: `'search'`
   - File: `src/app/ui-controller.ts` → Module: `'app/ui-controller'`
   - Keep names short and descriptive

4. Test after each file:
   ```bash
   npm run build -w packages/app
   ```

### Special Cases

#### Helper Functions
Some files have helper logging functions like:
```typescript
const log = (...args: any[]) => console.log('[Search]', ...args);
```
Replace with:
```typescript
const log = (...args: any[]) => logger.info('search', ...args);
```

#### Multi-line Console Statements
```typescript
// OLD:
console.log(
  '[Module] Long message',
  complexData,
);

// NEW:
logger.info(
  'module',
  'Long message',
  complexData,
);
```

#### Error Handling
```typescript
// OLD:
catch (err) {
  console.error('Failed:', err);
}

// NEW:
catch (err) {
  logger.error('module', 'Failed:', err);
}
```

### Files to Skip (Low Priority)
- Test files (`*.spec.ts`, `*.test.ts`)
- The logger itself (`utils/logger.ts`)
- Files with <5 console statements can be done in batch later

### Testing Strategy
1. Build after each file
2. Spot-check browser console in dev mode (should see logs)
3. Build production and verify minimal logging
4. Run Playwright tests to ensure no breakage

### Next Session Commands
```bash
# Start with highest-impact file
git checkout -b feat/console-log-cleanup-part2

# For each file:
# 1. Edit file (add import, replace statements)
# 2. Test build
npm run build -w packages/app

# 3. Commit incremental progress
git add packages/app/src/scripts/search.ts
git commit -m "refactor: Replace console statements with logger in search.ts"

# 4. Continue with next file...
```

### Success Criteria
- ✅ All high-priority files (top 10) converted
- ✅ Build succeeds
- ✅ Playwright tests pass
- ✅ Dev mode: Logs visible in console
- ✅ Production build: Only errors logged
- ✅ Bundle size increase <5KB

### Notes
- Logger adds ~1-2KB to bundle (acceptable for cleaner logging)
- Production builds will be significantly quieter
- Easier debugging in development with consistent format
- Future: Can add log levels configuration in config.json
