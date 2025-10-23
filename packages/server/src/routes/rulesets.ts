/**
 * Rulesets API Routes
 *
 * Provides endpoints to query and manage analysis rulesets from database
 */

import { Router, Request, Response, NextFunction } from 'express';
import { database } from '../services/database.js';

const router = Router();

/**
 * GET /api/v4/rulesets
 * Get all available rulesets
 *
 * Query params:
 * - enabled: Filter by enabled status (optional)
 */
router.get('/rulesets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.query;
    const filter: any = {};

    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }

    const rulesets = await database.rulesets.find(filter).sort({ name: 1 }).toArray();

    res.json({
      count: rulesets.length,
      rulesets: rulesets.map((r) => ({
        id: r._id?.toString(),
        name: r.name,
        displayName: r.displayName,
        description: r.description,
        enabled: r.enabled ?? true,
        rulesCount: r.rules?.length || 0,
        isDefault: r.isDefault ?? false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('[Rulesets API] Failed to fetch rulesets:', error?.message);
    next(error);
  }
});

/**
 * GET /api/v4/rulesets/:name
 * Get a specific ruleset by name
 */
router.get('/rulesets/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const ruleset = await database.rulesets.findOne({ name });

    if (!ruleset) {
      return res.status(404).json({
        error: 'Ruleset not found',
        message: `No ruleset found with name: ${name}`,
      });
    }

    res.json({
      id: ruleset._id?.toString(),
      name: ruleset.name,
      displayName: ruleset.displayName,
      description: ruleset.description,
      rules: ruleset.rules,
      enabled: ruleset.enabled ?? true,
      isDefault: ruleset.isDefault ?? false,
      createdBy: ruleset.createdBy,
      createdAt: ruleset.createdAt,
      updatedAt: ruleset.updatedAt,
    });
  } catch (error: any) {
    console.error('[Rulesets API] Failed to fetch ruleset:', error?.message);
    next(error);
  }
});

export { router as rulesetsRouter };
