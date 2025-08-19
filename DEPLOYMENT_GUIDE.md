# 🚀 Zion Grocery Dashboard - Deployment Guide

## Overview
This guide will help you deploy your Zion Grocery Dashboard to production with:
- **Frontend**: Already deployed on Netlify ✅
- **Backend**: Deploy to Railway/Render
- **Database**: PostgreSQL on Railway/Supabase

## 📋 Prerequisites
- Git repository with your code
- GitHub account
- Railway account (recommended) or Render account

---

## 🗄️ Step 1: Deploy PostgreSQL Database

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Provision PostgreSQL"
3. Once created, go to your PostgreSQL service
4. Click "Connect" tab and copy the `DATABASE_URL`
5. Save this URL - you'll need it for the backend

### Option B: Supabase (Alternative)
1. Go to [Supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → Database
4. Copy the connection string under "Connection string"

---

## 🔧 Step 2: Configure Backend for Production

### Update Environment Variables
1. Copy `.env.example` to `.env` in your backend folder
2. Update the following variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_url_from_step_1
JWT_SECRET=your_super_secure_jwt_secret_here
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### Get Your Netlify URL
1. Go to your Netlify dashboard
2. Find your deployed app
3. Copy the URL (e.g., `https://amazing-app-123456.netlify.app`)
4. Use this as your `FRONTEND_URL`

---

## 🚀 Step 3: Deploy Backend

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Node.js app
5. Set these environment variables in Railway:
   - `NODE_ENV=production`
   - `DATABASE_URL=your_postgresql_url`
   - `JWT_SECRET=your_secure_secret`
   - `FRONTEND_URL=https://your-netlify-app.netlify.app`
6. Deploy will start automatically

### Option B: Render (Alternative)
1. Go to [Render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Add the same variables as above

---

## 🔗 Step 4: Update Frontend API Configuration

Once your backend is deployed, you'll get a URL like:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`

### Update Frontend Config
1. Open `frontend/scripts/config.js`
2. Update the API base URL:

```javascript
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
```

3. Commit and push changes to trigger Netlify redeploy

---

## ✅ Step 5: Test Your Deployment

### Backend Health Check
Visit: `https://your-backend-url.railway.app/health`
Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

### Frontend Integration
1. Open your Netlify app URL
2. Try creating a product
3. Check if data persists after refresh
4. Test all CRUD operations

---

## 🔐 Environment Variables Summary

### Backend (Railway/Render)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
FRONTEND_URL=https://your-netlify-app.netlify.app
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Optional (M-Pesa Integration)
```env
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-backend-url.railway.app/api/mpesa/callback
```

---

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` matches your Netlify URL exactly
   - Check browser console for specific CORS messages

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check Railway/Supabase dashboard for connection details

3. **API Not Responding**
   - Check backend logs in Railway/Render dashboard
   - Verify health endpoint is accessible

4. **Frontend Can't Connect**
   - Ensure API_BASE_URL in config.js is correct
   - Check network tab in browser dev tools

### Getting Help
- Check Railway/Render logs for backend errors
- Use browser dev tools to debug frontend issues
- Verify all environment variables are set correctly

---

## 🎉 Success!

Once everything is working:
- ✅ PostgreSQL database running in the cloud
- ✅ Backend API deployed and accessible
- ✅ Frontend connected to backend
- ✅ Full CRUD operations working
- ✅ Data persisting between sessions

Your Zion Grocery Dashboard is now fully deployed and production-ready!
