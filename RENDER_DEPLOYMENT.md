# Hosting Nexus POS on Render

This guide explains how to deploy the Nexus POS system as a unified **Web Service** on [Render](https://render.com/).

## 1. Prepare your Database
1. Log in to your Render Dashboard.
2. Click **New +** > **PostgreSQL**.
3. Name it (e.g., `nexus-db`) and create it.
4. Once created, copy the **Internal Database URL** (or External if you are testing from local). You will need this for the environment variables.

## 2. Prepare your Repository
Ensure your project is pushed to GitHub. Render will pull directly from your repository.

## 3. Create the Web Service
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Use the following settings:
   - **Name**: `nexus-pos`
   - **Environment**: `Node`
   - **Region**: (Choose the one closest to you)
   - **Branch**: `main` (or your active development branch)
   - **Root Directory**: `.` (Keep as is)
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`

## 4. Configure Environment Variables
In the **Environment** tab of your Render Web Service, add the following variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Enables production optimizations. |
| `DATABASE_URL` | `postgres://...` | Paste your Render PostgreSQL URL here. |
| `FIREBASE_SERVICE_ACCOUNT` | `{...}` | Paste the ENTIRE JSON content of your Firebase Service Account key. |
| `DB_SSL` | `true` | Required for Render's managed PostgreSQL. |
| `PORT` | `10000` | Render usually provides this automatically. |

## 5. First-Time Database Initialization
The database schema needs to be initialized. You have two ways:

### Option A: Manual (Recommended for First Time)
1. In your Render Web Service dashboard, click **Shell**.
2. Run the following command:
   ```bash
   cd backend && node manual_schema.js
   ```
3. Watch the logs—it should say `🚀 Unified Multitenant Schema Applied Successfully`.

### Option B: Automatic (Pre-Deploy Command)
You can set Render to automatically run migrations before every deploy:
1. Go to **Settings** > **Pre-Deploy Command**.
2. Set it to: `cd backend && npm run migrate:prod`.
3. **Note**: This requires `DATABASE_URL` to be correctly set in your environment variables.

---

### 💡 Troubleshooting Build Failures
- **Unable to acquire a connection**: This error usually happens if a migration script tries to run during the `npm install` phase. I've removed the `postinstall` script that was causing this to ensure your builds are stable.
- **Node Version**: If you see a version mismatch, Render defaults to an older Node version. Use the `NODE_VERSION` environment variable or the `engines` field in `package.json` to specify your version (the project recommends `>=16.0.0`).
