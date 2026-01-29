# Deployment Guide for RetainAI

This guide will walk you through deploying your **RetainAI** application. The Backend will be hosted on **Render** (free tier available) and the Frontend on **Vercel**.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Render](https://render.com/) account.
- A [Vercel](https://vercel.com/) account.
- Git installed on your machine.

---

## Step 1: Push Code to GitHub

1. Initialize Git in your project root (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Prepare for deployment"
   ```
2. Create a new repository on GitHub.
3. Link your local repository to GitHub and push:
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Database Setup (Render)

1. Log in to **Render**.
2. Click **New +** -> **PostgreSQL**.
3. Name it (e.g., `retainai-db`).
4. Select the **Free** tier.
5. Click **Create Database**.
6. Once created, copy the **Internal Database URL** (for backend) and **External Database URL** (for local access if needed).
   - *Note: You will need the Internal URL for the Backend deployment step.*

---

## Step 3: Backend Deployment (Render)

1. on Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Select the **`Backend`** directory as the **Root Directory** (Important!).
4. Configure the service:
   - **Name**: `retainai-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**:
   - Scroll down to "Environment Variables".
   - Add `DATABASE_URL` and paste the **Internal Database URL** from Step 2.
   - Add `PYTHON_VERSION` with value `3.9.0` (optional, ensures compatibility).
6. Click **Create Web Service**.
7. Wait for the deployment to finish. Copy the **Service URL** (e.g., `https://retainai-backend.onrender.com`).

---

## Step 4: Frontend Deployment (Vercel)

1. Log in to **Vercel**.
2. Click **Add New ...** -> **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Root Directory**: Click "Edit" and select **`Frontend`**.
   - **Framework Preset**: Vite (should be auto-detected).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
5. **Environment Variables**:
   - Expand the "Environment Variables" section.
   - Key: `VITE_API_URL`
   - Value: The **Backend Service URL** from Step 3 (e.g., `https://retainai-backend.onrender.com`).
     - *Note: Do not add a trailing slash `/`.*
6. Click **Deploy**.

---

## Step 5: Final Check

1. Open your deployed Vercel URL.
2. The app should load and fetch data from your Render backend.
3. If you see errors, check the **Console** in browser DevTools or the **Logs** in Render/Vercel dashboards.

## Troubleshooting

- **Database Connection Error**: Ensure the `DATABASE_URL` in Render is correct.
- **Model Loading Error**: Ensure the `models/` directory was pushed to GitHub. Large files (>100MB) need Git LFS.
- **CORS Error**: We enabled `allow_origins=["*"]` in `main.py`, so this should work. If not, check if the Browser Console shows CORS errors.

Good luck!
