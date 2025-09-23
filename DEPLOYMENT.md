# 🚀 Deployment Guide - Options Trading Platform

## Quick Deploy to Vercel (Recommended)

### Step 1: Prepare Your Code
1. **Make sure all changes are committed:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Import your repository**
5. **Configure environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://gfakirsbobtibgltoqjg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYWtpcnNib2J0aWJnbHRvcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDA5NDAsImV4cCI6MjA3MzgxNjk0MH0.nMmTODvKMBmn-DgPLH6sEUzhGEH3iAP6ZqipM9ed1Jk`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYWtpcnNib2J0aWJnbHRvcWpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0MDk0MCwiZXhwIjoyMDczODE2OTQwfQ.0d08ocDDzSIA3k80_RqhjMUaJz1-ISrTeo5n1pV5t5Q`
6. **Click "Deploy"**

### Step 3: Configure Supabase for Production
1. **Go to your Supabase Dashboard**
2. **Settings > API**
3. **Add your Vercel domain to allowed origins:**
   - `https://your-app-name.vercel.app`
   - `https://your-app-name.vercel.app/*`

## Alternative: Deploy to Netlify

### Step 1: Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `out`
- **Node version:** `18.x`

### Step 2: Environment Variables
Add the same environment variables as Vercel.

## Alternative: Deploy to Railway

### Step 1: Connect Repository
1. **Go to [railway.app](https://railway.app)**
2. **Connect GitHub repository**
3. **Add environment variables**
4. **Deploy automatically**

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase RLS policies are enabled
- [ ] Database schema is up to date
- [ ] Domain is added to Supabase allowed origins
- [ ] HTTPS is working
- [ ] Authentication is working
- [ ] CSV upload is working

## Troubleshooting

### Common Issues:
1. **Environment variables not loading:** Check Vercel dashboard settings
2. **Supabase connection errors:** Verify allowed origins
3. **Build failures:** Check build logs in deployment platform
4. **Database errors:** Ensure RLS policies are correct

### Support:
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
