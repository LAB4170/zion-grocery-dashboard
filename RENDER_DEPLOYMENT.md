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
After the first successful build and deploy, the tables need to be created in your new Render database.

1. In your Render Web Service dashboard, click **Shell**.
2. Run the following command:
   ```bash
   cd backend && node manual_schema.js
   ```
3. Watch the logs—it should say `🚀 Unified Multitenant Schema Applied Successfully`.

## 6. Accessing the App
Once the status is **Live**, you can access your app at the `.onrender.com` URL provided by Render.

---

### 💡 Pro Tips
- **Socket.IO**: The project is already configured with polling fallback, so WebSocket connections will remain stable even behind Render's proxy.
- **Static Files**: The backend automatically serves the built React frontend from the `frontend-react/dist` folder.
- **Custom Domain**: You can add your own domain (e.g., `pos.yourbusiness.com`) in the Render **Settings** tab.
