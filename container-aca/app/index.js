import express from "express";
import { spawn } from "child_process";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Simple API key for the Azure Function to call us
const REQUIRED_KEY = process.env.PROVISION_API_KEY;

// Track whether a job is running
let busy = false;

// POST /provision  { repoUrl, envName?, ghToken? }
app.post("/provision", async (req, res) => {
  try {
    const key = req.headers["x-provision-key"];
    if (!REQUIRED_KEY || key !== REQUIRED_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { repoUrl, envName = "poc", ghToken } = req.body || {};
    if (!repoUrl || typeof repoUrl !== "string") {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    // Basic allowlist: only GitHub URLs
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(repoUrl)) {
      return res.status(400).json({ error: "Only GitHub URLs are allowed in this POC" });
    }

    if (busy) {
      return res.status(429).json({ status: "busy", error: "Another provisioning is in progress" });
    }

    busy = true;

    // Inject GH token for private repos (optional)
    const env = {
      ...process.env,
      GH_TOKEN: ghToken || ""
    };

    const args = ["/usr/local/bin/provision.sh", repoUrl, envName, process.env.AZURE_LOCATION || "westeurope"];

    const child = spawn(args[0], args.slice(1), { env });

    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("close", (code) => {
      busy = false;
      if (code === 0) {
        res.status(200).json({ status: "ok", log: out });
      } else {
        res.status(500).json({ status: "failed", code, error: err || out });
      }
    });
  } catch (e) {
    busy = false;
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Health endpoint
app.get("/healthz", (_req, res) => {
  res.json({ status: busy ? "busy" : "ready" });
});

const PORT = process.env.API_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Provisioner API listening on ${PORT}`);
});
