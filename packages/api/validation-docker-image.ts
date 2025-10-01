import { wrapHttp } from "./shared/http";
import { randomUUID } from "crypto";
import type { HttpRequest, Context } from "@azure/functions";

// Legacy JS helpers imported directly before; we re-implement minimal parts needed here
// NOTE: We rely on existing migrated TS functions for triggering workflows and fetching runs/artifacts.
// To avoid circular imports at runtime (Azure Functions loads each independently), we use dynamic imports.

const workflowOwner = process.env.GITHUB_REPO_OWNER || "Template-Doctor";
const workflowRepo = process.env.GITHUB_REPO_NAME || "template-doctor";
const workflowFile =
    process.env.GITHUB_WORKFLOW_FILE || "validate-docker-images.yml";
const fetchTimeoutMs = 30_000;

interface ArtifactSummary {
    id: number;
    name: string;
    url: string;
    archive_download_url: string;
}
interface ArtifactsResponse {
    artifacts: ArtifactSummary[];
}

interface TrivyProcessedResult {
    criticalVulns: number;
    highVulns: number;
    criticalMisconfigurations: number;
    secretsFound: number;
    artifactName?: string;
    repository?: string;
    tag?: string;
}

// Lightweight issue structure
interface Issue {
    id: string;
    severity: "warning" | "error";
    message: string;
    details?: any;
}
interface ComplianceItem {
    id: string;
    category: string;
    message: string;
    details?: any;
}

function addIssue(
    arr: Issue[],
    id: string,
    severity: Issue["severity"],
    message: string,
    details?: any,
) {
    arr.push({ id, severity, message, details });
}

async function triggerWorkflowDispatch(
    owner: string,
    repo: string,
    workflow: string,
    runId: string,
    ctx: any,
) {
    const mod = await import("./action-trigger");
    return (
        (mod as any).handlerInternal?.dispatch(
            owner,
            repo,
            workflow,
            { runId },
            ctx,
        ) ||
        (mod as any).triggerWorkflow?.(
            owner,
            repo,
            workflow,
            { runId },
            "runId",
            ctx,
        )
    );
}

async function getWorkflowRun(
    owner: string,
    repo: string,
    runId: number,
    ctx: any,
) {
    const mod = await import("./action-run-status");
    return (mod as any).getWorkflowRunData?.(owner, repo, runId, ctx);
}

async function getWorkflowArtifacts(
    owner: string,
    repo: string,
    runId: number,
    ctx: any,
): Promise<ArtifactsResponse> {
    const mod = await import("./action-run-artifacts");
    return (mod as any).getArtifactsForRun?.(owner, repo, runId, ctx);
}

// We reuse JS trivy utils by importing the existing CommonJS module.
async function loadTrivyUtils() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const utils = require("../../validation-docker-image/trivy-utils.js");
    return utils;
}

async function downloadRedirectFollowing(
    url: string,
    ctx: any,
): Promise<ArrayBuffer> {
    const token = process.env.GH_WORKFLOW_TOKEN;
    if (!token) throw new Error("Missing GH_WORKFLOW_TOKEN app setting");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
    try {
        const first = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            redirect: "manual",
            signal: controller.signal,
        });
        if ([301, 302, 307, 308].includes(first.status)) {
            const loc = first.headers.get("location");
            if (!loc) throw new Error("Redirect without Location header");
            const second = await fetch(loc, {
                headers: { Accept: "application/octet-stream" },
                signal: AbortSignal.timeout(fetchTimeoutMs),
            });
            if (!second.ok)
                throw new Error(
                    `Artifact storage download failed ${second.status}`,
                );
            return await second.arrayBuffer();
        }
        if (!first.ok)
            throw new Error(`Artifact download failed ${first.status}`);
        return await first.arrayBuffer();
    } finally {
        clearTimeout(timeout);
    }
}

function findRepoArtifact(
    artifacts: ArtifactSummary[],
): ArtifactSummary | undefined {
    return artifacts.find((a) => a.name?.startsWith("scan-repo-"));
}
function findImageArtifacts(artifacts: ArtifactSummary[]): ArtifactSummary[] {
    return artifacts.filter((a) => a.name?.startsWith("scan-image-"));
}

async function processArtifacts(
    ctx: any,
    artifacts: ArtifactSummary[],
    correlationId: string,
    includeAllDetails: boolean,
) {
    const issues: Issue[] = [];
    const compliance: ComplianceItem[] = [];
    const { extractTrivyResults, processTrivyResultsDetails } =
        await loadTrivyUtils();

    // Repo scan
    let repoResult: TrivyProcessedResult | null = null;
    const repoArtifact = findRepoArtifact(artifacts);
    if (repoArtifact) {
        const buf = await downloadRedirectFollowing(
            repoArtifact.archive_download_url,
            ctx,
        );
        const rawRepo = await extractTrivyResults(ctx, buf, correlationId);
        repoResult = processTrivyResultsDetails(rawRepo, includeAllDetails);
    } else {
        addIssue(
            issues,
            "docker-repo-artifact-missing",
            "warning",
            "Repository scan artifact not found",
        );
    }

    // Image scans (process sequentially to limit memory; could batch later)
    const imageArtifacts = findImageArtifacts(artifacts);
    const imageResults: TrivyProcessedResult[] = [];
    for (const art of imageArtifacts) {
        try {
            const buf = await downloadRedirectFollowing(
                art.archive_download_url,
                ctx,
            );
            const raw = await extractTrivyResults(ctx, buf, correlationId);
            const processed = processTrivyResultsDetails(
                raw,
                includeAllDetails,
            );
            imageResults.push(processed);
        } catch (err: any) {
            addIssue(
                issues,
                "docker-image-artifact-error",
                "warning",
                `Failed processing image artifact ${art.name}: ${err.message}`,
            );
        }
    }

    // Compliance / issues aggregation (mirrors legacy logic simplified)
    const applyResult = (prefix: string, r: TrivyProcessedResult | null) => {
        if (!r) return;
        if (r.criticalVulns > 0)
            addIssue(
                issues,
                `${prefix}-critical-vulns`,
                "error",
                `${prefix} contains ${r.criticalVulns} critical vulnerabilities`,
                { count: r.criticalVulns },
            );
        else
            compliance.push({
                id: `${prefix}-no-critical-vulns`,
                category: "security",
                message: `${prefix} contains no critical vulnerabilities`,
            });
        if (r.highVulns > 0)
            addIssue(
                issues,
                `${prefix}-high-vulns`,
                "warning",
                `${prefix} contains ${r.highVulns} high vulnerabilities`,
                { count: r.highVulns },
            );
        else
            compliance.push({
                id: `${prefix}-no-high-vulns`,
                category: "security",
                message: `${prefix} contains no high vulnerabilities`,
            });
        if (r.criticalMisconfigurations > 0)
            addIssue(
                issues,
                `${prefix}-critical-misconfigurations`,
                "error",
                `${prefix} has ${r.criticalMisconfigurations} critical misconfigurations`,
                { count: r.criticalMisconfigurations },
            );
        else
            compliance.push({
                id: `${prefix}-no-critical-misconfigurations`,
                category: "security",
                message: `${prefix} has no critical misconfigurations`,
            });
        if (r.secretsFound > 0)
            addIssue(
                issues,
                `${prefix}-secrets-found`,
                "error",
                `${prefix} contains ${r.secretsFound} potential secrets`,
                { count: r.secretsFound },
            );
        else
            compliance.push({
                id: `${prefix}-no-secrets`,
                category: "security",
                message: `${prefix} contains no exposed secrets`,
            });
    };
    applyResult("repository", repoResult);
    imageResults.forEach((r, i) => applyResult(`image-${i + 1}`, r));

    return { repoResult, imageResults, issues, compliance };
}

export const handler = wrapHttp(async (req: HttpRequest, ctx: Context) => {
    if (req.method !== "POST")
        return { status: 405, body: { error: "Method not allowed" } };

    const correlationId = randomUUID();
    const body = (req.body as any) || {};
    const templateUrl: string | undefined = body.templateUrl;
    const includeAllDetails = body.includeAllDetails === true;
    if (!templateUrl || !templateUrl.includes("/")) {
        return {
            status: 400,
            body: { error: "templateUrl is required owner/repo" },
        };
    }
    const [owner, repo] = templateUrl.split("/", 2);

    // Trigger workflow
    const runIdAlias = correlationId; // internal tracking id
    const trig = await triggerWorkflowDispatch(
        workflowOwner,
        workflowRepo,
        workflowFile,
        runIdAlias,
        ctx,
    );
    if (!trig || trig.status !== 200 || !trig.found) {
        return {
            status: trig?.status || 502,
            body: { error: "Failed to trigger docker image workflow" },
        };
    }
    const workflowRunId = trig.runId;

    // Poll for completion (simplified compared to legacy: shorter attempts for responsiveness in tests)
    let attempts = 0;
    const maxAttempts = 30;
    const delayMs = 10_000;
    let runData: any;
    while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
        runData = await getWorkflowRun(
            workflowOwner,
            workflowRepo,
            workflowRunId,
            ctx,
        );
        if (runData?.status === "completed") break;
        attempts++;
    }
    if (runData?.status !== "completed") {
        return {
            status: 504,
            body: { error: "Workflow did not complete in expected time" },
        };
    }

    const artifactsResp = (await getWorkflowArtifacts(
        workflowOwner,
        workflowRepo,
        workflowRunId,
        ctx,
    )) as ArtifactsResponse;
    const artifacts = artifactsResp?.artifacts || [];
    if (artifacts.length === 0) {
        return {
            status: 500,
            body: { error: "No artifacts found from workflow run" },
        };
    }

    const processed = await processArtifacts(
        ctx,
        artifacts,
        correlationId,
        includeAllDetails,
    );
    const reportable = artifacts.map((a) => ({
        name: a.name,
        id: a.id,
        url: a.url,
        download: a.archive_download_url,
    }));
    return {
        status: 200,
        body: {
            api: "trivy-docker-image",
            templateUrl,
            runId: runIdAlias,
            githubRunId: workflowRunId,
            details: {
                complianceResults: {
                    repositoryScan: processed.repoResult,
                    imageScans: processed.imageResults,
                },
                artifacts: reportable,
            },
            issues: processed.issues,
            compliance: processed.compliance,
        },
    };
});

export default handler;
