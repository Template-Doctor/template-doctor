# Troubleshooting Azure Container Apps Deployment

## Common Deployment Failures

### Issue: "Deployment failed" after Container App was created

This usually happens when the container app was created successfully, but the container itself fails to start due to missing configuration.

#### Quick Fix:

1. **Add Required Environment Variables IMMEDIATELY After Deployment:**

   Even though the deployment "failed", your Container App exists. You need to add environment variables before it can start:

   **Via Azure Portal:**
   1. Go to Azure Portal → Your Container App
   2. Settings → **Secrets** (Add secrets first)
      - Click **+ Add**
      - Add these secrets:
        ```
        github-client-secret = <your-github-oauth-client-secret>
        github-token = <your-github-personal-access-token>
        gh-workflow-token = <your-workflow-token>
        ```
   
   3. Settings → **Environment variables**
      - Click **+ Add** for each:
        ```
        PORT = 3000
        FRONTEND_DIST_PATH = /app/app/dist
        GITHUB_CLIENT_ID = <your-oauth-client-id>
        GITHUB_CLIENT_SECRET = secretref:github-client-secret
        GITHUB_TOKEN = secretref:github-token
        GH_WORKFLOW_TOKEN = secretref:gh-workflow-token
        ```
   
   4. Click **Save**
   5. The app will restart automatically

   **Via Azure CLI:**
   ```bash
   # Set your variables
   APP_NAME="<your-container-app-name>"
   RG_NAME="<your-resource-group-name>"
   
   # Add secrets
   az containerapp secret set \
     --name $APP_NAME \
     --resource-group $RG_NAME \
     --secrets \
       github-client-secret=<your-secret> \
       github-token=<your-token> \
       gh-workflow-token=<your-token>
   
   # Add environment variables
   az containerapp update \
     --name $APP_NAME \
     --resource-group $RG_NAME \
     --set-env-vars \
       PORT=3000 \
       FRONTEND_DIST_PATH=/app/app/dist \
       GITHUB_CLIENT_ID=<your-id> \
       GITHUB_CLIENT_SECRET=secretref:github-client-secret \
       GITHUB_TOKEN=secretref:github-token \
       GH_WORKFLOW_TOKEN=secretref:gh-workflow-token
   ```

2. **Check Logs to Verify It's Running:**

   ```bash
   az containerapp logs show \
     --name $APP_NAME \
     --resource-group $RG_NAME \
     --follow
   ```

   Look for:
   ```
   🚀 Template Doctor server running on port 3000
   📊 Health check: http://localhost:3000/api/health
   ```

### Issue: Container keeps restarting

**Check health check endpoint:**

The Dockerfile has a health check that pings `/api/health`. If this fails, the container restarts.

**Verify locally:**
```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e FRONTEND_DIST_PATH=/app/app/dist \
  -e GITHUB_CLIENT_ID=test \
  -e GITHUB_CLIENT_SECRET=test \
  -e GITHUB_TOKEN=test \
  -e GH_WORKFLOW_TOKEN=test \
  template-doctor:test

# In another terminal:
curl http://localhost:3000/api/health
```

### Issue: OAuth not working after deployment

1. **Get your Container App URL:**
   ```bash
   az containerapp show \
     --name $APP_NAME \
     --resource-group $RG_NAME \
     --query properties.configuration.ingress.fqdn \
     -o tsv
   ```

2. **Update GitHub OAuth App:**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Update **Authorization callback URL** to:
     ```
     https://<your-fqdn>/callback.html
     ```

### Issue: "Image pull failed"

This happens when the Container Registry authentication fails.

**Fix:**
1. Go to Azure Portal → Your Container App
2. Settings → **Containers**
3. Verify the registry credentials are set
4. If using Azure Container Registry, ensure it was created in the same resource group

**Or via CLI:**
```bash
# Get ACR credentials
ACR_NAME="<your-acr-name>"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
ACR_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Update container app with registry credentials
az containerapp registry set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --server $ACR_SERVER \
  --username $ACR_USERNAME \
  --password $ACR_PASSWORD
```

### Issue: "Insufficient permissions"

You need Contributor role on the resource group or subscription.

**Check your permissions:**
```bash
az role assignment list \
  --assignee $(az account show --query user.name -o tsv) \
  --resource-group $RG_NAME
```

**Request access** from your Azure subscription admin if needed.

## Deployment Best Practices

### 1. Test Locally First

Always test the Docker image locally before deploying:

```bash
# Build
docker build -f Dockerfile.combined -t template-doctor:test .

# Run with minimal env vars
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e FRONTEND_DIST_PATH=/app/app/dist \
  -e GITHUB_CLIENT_ID=<your-id> \
  -e GITHUB_CLIENT_SECRET=<your-secret> \
  -e GITHUB_TOKEN=<your-token> \
  -e GH_WORKFLOW_TOKEN=<your-token> \
  template-doctor:test

# Test health endpoint
curl http://localhost:3000/api/health
```

### 2. Deploy in Stages

1. **First deployment:** Let it fail (expected)
2. **Add secrets:** Via Portal or CLI
3. **Add environment variables:** Reference secrets
4. **Verify logs:** Check container started
5. **Test endpoints:** Verify app is accessible

### 3. Use Azure CLI for Faster Debugging

```bash
# Quick status check
az containerapp show \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --query "{name:name, status:properties.runningStatus, url:properties.configuration.ingress.fqdn}"

# View recent logs
az containerapp logs show \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --tail 100

# Force restart
az containerapp revision restart \
  --name $APP_NAME \
  --resource-group $RG_NAME
```

## Complete Environment Variables Checklist

### Required (App won't start without these):
- ✅ `PORT` = `3000`
- ✅ `FRONTEND_DIST_PATH` = `/app/app/dist`
- ✅ `GITHUB_CLIENT_ID` = `<your-oauth-client-id>`
- ✅ `GITHUB_CLIENT_SECRET` = `secretref:github-client-secret`
- ✅ `GITHUB_TOKEN` = `secretref:github-token`
- ✅ `GH_WORKFLOW_TOKEN` = `secretref:gh-workflow-token`

### Optional (Features work with defaults):
- `GH_ANALYZER_TOKEN` = `secretref:gh-analyzer-token` (or use GITHUB_TOKEN)
- `CONFIG_GIST_ID` = `<gist-id>` (for setup endpoint persistence)
- `SETUP_ALLOWED_USERS` = `username1,username2` (for setup access)
- `DISPATCH_TARGET_REPO` = `Template-Doctor/template-doctor`
- `DEFAULT_RULE_SET` = `dod`
- `REQUIRE_AUTH_FOR_RESULTS` = `true`
- `AUTO_SAVE_RESULTS` = `false`
- `ARCHIVE_ENABLED` = `true`
- `ARCHIVE_COLLECTION` = `gallery`

## Verification Steps

After adding environment variables:

1. **Check health endpoint:**
   ```bash
   curl https://<your-fqdn>/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-10-06T...",
     "env": {
       "hasGitHubToken": true,
       "hasWorkflowToken": true,
       "hasAnalyzerToken": true
     }
   }
   ```

2. **Check client settings:**
   ```bash
   curl https://<your-fqdn>/api/v4/client-settings
   ```

3. **Test frontend:**
   Open `https://<your-fqdn>` in browser

## Still Having Issues?

### Enable detailed logging:

1. Azure Portal → Your Container App
2. Settings → **Revisions and replicas**
3. Click on the active revision
4. View **Console logs**

### Check Container App Events:

```bash
az containerapp revision list \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  -o table
```

### Contact Support:

If issues persist, gather this information:
- Container App name and resource group
- Error messages from logs
- Output of: `az containerapp show --name $APP_NAME --resource-group $RG_NAME`
