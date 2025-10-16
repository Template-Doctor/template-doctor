// Admin configuration management endpoints
import { Router, Request, Response } from "express";
import { ConfigurationStorage } from "../services/configuration-storage.js";

export const adminRouter = Router();

// Get all configuration settings
adminRouter.get("/settings", async (req: Request, res: Response) => {
  try {
    const settings = await ConfigurationStorage.getAll();
    res.json(settings);
  } catch (error) {
    console.error('[admin] Failed to get settings:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve settings',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get settings by category
adminRouter.get("/settings/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const allSettings = await ConfigurationStorage.getAll();
    const settings = allSettings.filter(s => s.category === category);
    res.json(settings);
  } catch (error) {
    console.error('[admin] Failed to get settings by category:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve settings',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get single setting
adminRouter.get("/settings/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = await ConfigurationStorage.get(key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key, value });
  } catch (error) {
    console.error('[admin] Failed to get setting:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve setting',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update single setting
adminRouter.put("/settings/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Missing value in request body' });
    }
    
    // Get authenticated user (from GitHub OAuth, if available)
    const updatedBy = req.headers['x-github-user'] as string | undefined;
    
    const setting = await ConfigurationStorage.set(key, value, updatedBy);
    res.json(setting);
  } catch (error) {
    console.error('[admin] Failed to update setting:', error);
    res.status(500).json({ 
      error: 'Failed to update setting',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update multiple settings
adminRouter.post("/settings", async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'settings must be an array' });
    }
    
    // Validate all settings have key and value
    for (const setting of settings) {
      if (!setting || typeof setting !== 'object' || !setting.key || setting.value === undefined) {
        return res.status(400).json({ 
          error: 'Invalid setting format. Expected { key: string, value: any }' 
        });
      }
    }
    
    const updatedBy = req.headers['x-github-user'] as string | undefined;
    
    // Convert array to object format
    const settingsObj: Record<string, string | number | boolean> = {};
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value;
    }
    
    await ConfigurationStorage.setMany(settingsObj, updatedBy);
    res.json({ success: true, updated: Object.keys(settingsObj).length });
  } catch (error) {
    console.error('[admin] Failed to update settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete setting
adminRouter.delete("/settings/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const deleted = await ConfigurationStorage.delete(key);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[admin] Failed to delete setting:', error);
    res.status(500).json({ 
      error: 'Failed to delete setting',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Initialize default settings (idempotent)
adminRouter.post("/settings/initialize", async (req: Request, res: Response) => {
  try {
    await ConfigurationStorage.initializeDefaults();
    res.json({ success: true, message: 'Default settings initialized' });
  } catch (error) {
    console.error('[admin] Failed to initialize settings:', error);
    res.status(500).json({ 
      error: 'Failed to initialize settings',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
