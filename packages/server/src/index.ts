import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local (if exists) and .env
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config(); // Also load from root .env as fallback

const app: Express = express();
const port = process.env.PORT || 3000; // Default to 3000 for OAuth compatibility

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build (if available)
// Use FRONTEND_DIST_PATH env var if set (for Docker), otherwise calculate relative path
const staticPath =
    process.env.FRONTEND_DIST_PATH || path.join(__dirname, "../../app/dist");
app.use(express.static(staticPath));

// Health check
app.get("/api/health", async (req: Request, res: Response) => {
    const { database } = await import("./services/database.js");
    const dbHealth = await database.healthCheck();
    
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: dbHealth,
        env: {
            hasGitHubToken: !!process.env.GITHUB_TOKEN,
            hasWorkflowToken: !!process.env.GH_WORKFLOW_TOKEN,
            hasAnalyzerToken: !!process.env.GITHUB_TOKEN_ANALYZER,
            hasMongoDbUri: !!process.env.MONGODB_URI,
            hasCosmosEndpoint: !!process.env.COSMOS_ENDPOINT,
        },
    });
});

// Import routes
import { analyzeRouter } from "./routes/analyze.js";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { validationRouter } from "./routes/validation.js";
import { githubRouter } from "./routes/github.js";
import { analysisRouter } from "./routes/analysis.js";
import { actionsRouter } from "./routes/actions.js";
import { miscRouter } from "./routes/misc.js";
import { resultsRouter } from "./routes/results.js";

// Initialize database connection
import { database } from "./services/database.js";

(async () => {
    try {
        // Connect to database if MongoDB URI or Cosmos endpoint is configured
        if (process.env.MONGODB_URI || process.env.COSMOS_ENDPOINT) {
            const dbType = process.env.MONGODB_URI ? 'Local MongoDB' : 'Cosmos DB';
            console.log(`🔌 Connecting to ${dbType}...`);
            await database.connect();
            console.log('✅ Database connected');
        } else {
            console.log('⚠️  No database configured - database features disabled');
            console.log('   Set MONGODB_URI (local) or COSMOS_ENDPOINT (Cosmos DB)');
        }
    } catch (error: any) {
        console.error('❌ Database connection failed:', error?.message);
        console.error('   Database features will be unavailable');
    }
})();

// Register API routes under /api/v4
app.use("/api/v4", analyzeRouter);
app.use("/api/v4", authRouter);
app.use("/api/v4", configRouter);
app.use("/api/v4", validationRouter);
app.use("/api/v4", githubRouter);
app.use("/api/v4", analysisRouter);
app.use("/api/v4", actionsRouter);
app.use("/api/v4", miscRouter);
app.use("/api/v4", resultsRouter);

// Fallback to serve index.html for client-side routing (SPA)
app.get("*", (req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(staticPath, "index.html"));
    } else {
        res.status(404).json({ error: "API endpoint not found" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Template Doctor server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(
        `🔑 GitHub Token configured: ${!!process.env.GH_WORKFLOW_TOKEN || !!process.env.GITHUB_TOKEN}`,
    );
    console.log(`📁 Serving static files from: ${staticPath}`);
});

export default app;
