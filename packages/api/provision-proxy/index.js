module.exports = async function (context, req) {
    const PROVISION_API_URL = process.env.PROVISION_API_URL;
    const PROVISION_API_KEY = process.env.PROVISION_API_KEY;

    if (!PROVISION_API_URL || !PROVISION_API_KEY) {
        context.res = {
            status: 500,
            body: { error: "Function app not configured" }
        };
        return;
    }

    try {
        if (req.method === "POST") {
            // Handle provisioning request
            const { repoUrl, envName, ghToken } = req.body || {};

            if (!repoUrl || typeof repoUrl !== "string") {
                context.res = { status: 400, body: { error: "repoUrl is required" } };
                return;
            }

            const response = await fetch(PROVISION_API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-provision-key": PROVISION_API_KEY 
                },
                body: JSON.stringify({ repoUrl, envName, ghToken })
            });

            const text = await response.text();
            let body;
            try { body = JSON.parse(text); } catch { body = { raw: text }; }

            context.res = { status: response.status, body };
        } else if (req.method === "GET") {
    // Health check
    const baseUrl = new URL(PROVISION_API_URL).origin;
    const response = await fetch(`${baseUrl}/healthz`, {
        method: "GET",
        headers: {
            "x-provision-key": PROVISION_API_KEY
        }
    });

    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }

    context.res = { status: response.status, body };
}
 else {
            context.res = { status: 405, body: { error: "Method not allowed" } };
        }
    } catch (err) {
        context.log.error(err);
        context.res = { status: 500, body: { error: err?.message || String(err) } };
    }
};
