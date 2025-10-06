# Deploy Template Doctor to Azure Container Apps (VS Code Extension)

This guide shows you how to deploy Template Doctor to Azure Container Apps using the VS Code extension.

## Prerequisites

1. **VS Code Extensions** (already installed):
   - Azure Container Apps (`ms-azuretools.vscode-azurecontainerapps`)
   - Azure Resources (`ms-azuretools.vscode-azureresourcegroups`)
   - Docker (`ms-azuretools.vscode-docker`)

2. **Azure Account**: Sign in to Azure in VS Code
3. **Docker**: The `Dockerfile.combined` is ready to use

## Deployment Steps

### 1. Sign in to Azure

1. Open VS Code Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run: `Azure: Sign In`
3. Follow the browser authentication flow

### 2. Deploy to Container Apps

1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `Azure Container Apps: Deploy to Container App...`
3. Follow the prompts:

   **Step 1: Select Dockerfile**
   - Choose: `Dockerfile.combined`

   **Step 2: Select Azure Subscription**
   - Choose your Azure subscription

   **Step 3: Resource Group**
   - Create new or select existing resource group
   - Suggested name: `rg-template-doctor`

   **Step 4: Container App Name**
   - Enter a unique name (e.g., `template-doctor` or `template-doctor-prod`)

   **Step 5: Container Apps Environment**
   - Create new environment
   - Name: `cae-template-doctor`
   - Select region (e.g., `East US`, `West Europe`)

   **Step 6: Build Platform**
   - Choose: `Azure Container Registry (Build in Azure)`
   - This will create an Azure Container Registry and build your image in the cloud

   **Step 7: Container Registry**
   - Create new or select existing
   - Suggested name: `crtemplateddoctor<random>` (must be globally unique)

4. Wait for deployment to complete (5-10 minutes for first deployment)

### 3. Configure Environment Variables

After deployment, you need to add environment variables:

1. In VS Code, open the **Azure** panel (Azure icon in sidebar)
2. Expand: **Container Apps** → Your subscription → Your container app
3. Right-click your container app → **Open in Portal**

4. In Azure Portal:
   - Go to **Settings** → **Environment variables**
   - Click **+ Add** for each variable:

   **Required Variables:**
   ```
   PORT = 3000
   FRONTEND_DIST_PATH = /app/app/dist
   GITHUB_CLIENT_ID = <your-github-oauth-client-id>
   GITHUB_CLIENT_SECRET = <your-github-oauth-client-secret>
   GITHUB_TOKEN = <your-github-token>
   GH_WORKFLOW_TOKEN = <your-github-workflow-token>
   ```

   **Optional Variables:**
   ```
   GH_ANALYZER_TOKEN = <separate-analyzer-token>
   CONFIG_GIST_ID = <gist-id-for-setup>
   SETUP_ALLOWED_USERS = username1,username2
   DISPATCH_TARGET_REPO = Template-Doctor/template-doctor
   DEFAULT_RULE_SET = dod
   REQUIRE_AUTH_FOR_RESULTS = true
   AUTO_SAVE_RESULTS = false
   ARCHIVE_ENABLED = true
   ARCHIVE_COLLECTION = gallery
   ISSUE_AI_ENABLED = 
   ```

5. Click **Save** at the top
6. The container app will restart automatically with new environment variables

### 4. Update GitHub OAuth Redirect URI

1. Get your Container App URL:
   - In Azure Portal, on your Container App overview page
   - Copy the **Application URL** (format: `https://<app-name>.<region>.azurecontainerapps.io`)

2. Update GitHub OAuth App:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Select your OAuth App
   - Update **Authorization callback URL** to:
     ```
     https://<your-app-url>/callback.html
     ```
   - Click **Update application**

### 5. Test Your Deployment

1. Open your Container App URL in a browser
2. Click "Sign in with GitHub"
3. Verify OAuth flow works correctly

## Subsequent Deployments

To deploy code updates:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `Azure Container Apps: Deploy to Container App...`
3. Select the same Container App
4. Choose `Dockerfile.combined`
5. Deployment will be much faster (only builds and deploys code changes)

## Alternative: Deploy from Azure Panel

1. Open **Azure** panel in VS Code (sidebar)
2. Expand **Container Apps**
3. Right-click your container app
4. Select **Deploy to Container App...**
5. Follow the same prompts

## View Logs

### From VS Code:

1. Open **Azure** panel
2. Expand: **Container Apps** → Your subscription → Your container app
3. Right-click → **View Logs Stream**

### From Azure Portal:

1. Go to your Container App
2. Click **Log stream** in the left menu

## Scaling & Configuration

### Update Container Resources:

1. In Azure Portal → Your Container App
2. Go to **Application** → **Containers**
3. Click your container → **Edit**
4. Adjust:
   - CPU: 1.0 cores (default)
   - Memory: 2 Gi (default)

### Configure Scaling:

1. Go to **Application** → **Scale**
2. Set:
   - Min replicas: 1 (or 0 to scale to zero)
   - Max replicas: 3-10 (based on traffic)
3. Add scaling rules (HTTP, CPU, Memory)

## Troubleshooting

### Deployment fails

**Check Docker build:**
```bash
docker build -f Dockerfile.combined -t template-doctor:test .
docker run -p 3000:3000 --env-file .env template-doctor:test
```

### Container won't start

1. Check logs in Azure Portal
2. Verify all required environment variables are set
3. Ensure `PORT=3000` and `FRONTEND_DIST_PATH=/app/app/dist`

### OAuth not working

1. Verify GitHub OAuth redirect URI matches Container App URL
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in environment variables
3. Ensure they match your GitHub OAuth App settings

## Cost Estimation

Azure Container Apps pricing:
- **Consumption plan**: Pay only for what you use
- **vCPU**: ~$0.000012/second
- **Memory**: ~$0.000003/second
- **Free tier**: 180,000 vCPU-seconds and 360,000 GiB-seconds per month

Estimated cost with low traffic: **$30-50/month**

## VS Code Extension Features

### Right-click menu on Container App:
- **Deploy to Container App** - Redeploy code
- **Browse** - Open app in browser
- **View Logs Stream** - Real-time logs
- **Restart** - Restart container app
- **Delete** - Remove container app
- **Open in Portal** - Open in Azure Portal

### Manage Resources:
- View/edit environment variables
- View/edit secrets
- View container details
- Monitor revisions
- View metrics

## Clean Up

To delete all resources:

1. In VS Code Azure panel
2. Right-click your Container App → **Delete**
3. Optionally delete Resource Group (deletes all related resources):
   - Right-click Resource Group → **Delete Resource Group**

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [VS Code Azure Container Apps Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurecontainerapps)
- [Container Apps Pricing](https://azure.microsoft.com/pricing/details/container-apps/)
