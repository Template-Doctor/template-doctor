(() => {
  // src/scripts/api-client.ts
  var backendEnabled = () => true;
  var apiBase = () => window.TemplateDoctorConfig?.apiBase || "/api";
  async function httpJson(path, init) {
    const res = await fetch(apiBase().replace(/\/$/, "") + path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers || {} }
    });
    if (!res.ok) {
      let detail = void 0;
      try {
        detail = await res.json();
      } catch {
      }
      const err = new Error(`HTTP ${res.status} ${path} ${detail && detail.error || ""}`);
      if (detail) Object.assign(err, detail);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  var ApiClient = {
    async createIssue(req) {
      if (backendEnabled()) {
        return httpJson("/v4/issue-create", { method: "POST", body: JSON.stringify(req) });
      }
      const gh = window.GitHubClient;
      if (!gh) throw new Error("GitHubClient not ready");
      if (req.labels?.length) {
        await gh.ensureLabelsExist(req.owner, req.repo, req.labels);
      }
      const issue = await gh.createIssueGraphQL({ owner: req.owner, repo: req.repo, title: req.title, body: req.body, labels: req.labels });
      if (req.assignCopilot) {
        try {
          await gh.assignIssueToCopilotBot(issue.issueNodeId);
        } catch {
        }
      }
      return { issueNumber: issue.number, htmlUrl: issue.url, labelsEnsured: req.labels || [], labelsCreated: [], copilotAssigned: !!req.assignCopilot };
    },
    async forkRepository(req) {
      if (backendEnabled()) {
        try {
          return await httpJson("/v4/repo-fork", { method: "POST", body: JSON.stringify(req) });
        } catch (e) {
          if (e?.samlRequired) {
            try {
              const showSamlNotification = () => {
                try {
                  const w2 = window;
                  if (!w2.NotificationSystem && w2.Notifications) w2.NotificationSystem = w2.Notifications;
                  const ns = w2.NotificationSystem;
                  if (ns && typeof ns.show === "function") {
                    ns.show({
                      title: "SAML Authorization Required",
                      message: "This repository requires SAML SSO authorization before forking. Use the authorization link if provided.",
                      type: "warning",
                      duration: 12e3,
                      actions: e.authorizeUrl ? [{ label: "Authorize SAML", primary: true, onClick: () => window.open(e.authorizeUrl, "_blank") }] : []
                    });
                    try {
                      const container = document.getElementById("notification-container") || document.querySelector(".notification-container");
                      if (container) {
                        const last = container.querySelector(".notification.warning:last-of-type");
                        if (last && !last.getAttribute("role")) {
                          last.setAttribute("role", "alert");
                          last.setAttribute("aria-live", "assertive");
                        }
                      }
                    } catch (_) {
                    }
                  }
                } catch (_) {
                }
              };
              const w = window;
              if ((w.NotificationSystem || w.Notifications) && (w.NotificationSystem?.show || w.Notifications?.show)) {
                showSamlNotification();
              } else {
                document.addEventListener("notifications-ready", showSamlNotification, { once: true });
              }
            } catch (_) {
            }
            return { forkOwner: req.targetOwner || "unknown", repo: req.sourceRepo, htmlUrl: void 0, ready: false, attemptedCreate: false, samlRequired: true, documentationUrl: e.documentationUrl, authorizeUrl: e.authorizeUrl, error: e.error };
          }
          throw e;
        }
      }
      const gh = window.GitHubClient;
      if (!gh) throw new Error("GitHubClient not ready");
      try {
        if (!gh.auth || typeof gh.auth.getAccessToken !== "function" && typeof gh.auth.getToken !== "function") {
          console.warn("[ApiClient] GitHubClient.auth incomplete; proceeding with forkRepository anyway");
        }
      } catch {
      }
      const result = await gh.forkRepository(req.sourceOwner, req.sourceRepo).catch((e) => {
        console.error("[ApiClient] direct forkRepository error", e?.message || e);
        throw e;
      });
      return { forkOwner: result.forkOwner || (gh.auth?.getUsername?.() || "unknown"), repo: req.sourceRepo, htmlUrl: result.htmlUrl || result.html_url, ready: true, attemptedCreate: true };
    },
    async startBatchScan(repos, mode) {
      if (!backendEnabled()) throw new Error("Backend feature disabled");
      return httpJson("/v4/batch-scan-start", { method: "POST", body: JSON.stringify({ repos, mode }) });
    },
    async getBatchStatus(batchId) {
      if (!backendEnabled()) throw new Error("Backend feature disabled");
      const res = await fetch(apiBase().replace(/\/$/, "") + "/v4/batch-scan-status?batchId=" + encodeURIComponent(batchId));
      if (!res.ok) throw new Error("HTTP " + res.status + " batch-scan-status");
      return res.json();
    }
  };
  window.TemplateDoctorApiClient = ApiClient;
  document.dispatchEvent(new CustomEvent("api-client-ready"));
})();
//# sourceMappingURL=api-client.bundle.js.map
