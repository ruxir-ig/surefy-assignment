# Deployment Guide - Vercel

This guide will help you deploy the Event Management System to Vercel with PostgreSQL database.

## Prerequisites

1. **GitHub Account** - Your code is already on GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Vercel CLI** (optional) - For command-line deployment

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Sign Up / Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project

1. Click "Add New..." → "Project"
2. Find your repository: `ruxir-ig/surefy-assignment`
3. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Other (leave as is)

**Build & Development Settings:**
- Build Command: Leave empty or use `echo "Build complete"`
- Output Directory: Leave empty
- Install Command: `npm install`

**Environment Variables:**

Click "Environment Variables" and add the following:

```
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
SESSION_SECRET=generate-a-random-secret-key-here
NODE_ENV=production
```

**Note:** You'll set up the database in the next step.

### Step 4: Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name (e.g., `event-db`)
5. Click "Create"
6. Vercel will automatically add environment variables to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

7. Update your environment variables to use these:
   ```
   DB_USER=$POSTGRES_USER
   DB_HOST=$POSTGRES_HOST
   DB_NAME=$POSTGRES_DATABASE
   DB_PASSWORD=$POSTGRES_PASSWORD
   DB_PORT=5432
   ```

**Option B: External PostgreSQL (e.g., Neon, Supabase, Railway)**

If you prefer an external database:

1. **Neon** (Free tier): [neon.tech](https://neon.tech)
2. **Supabase** (Free tier): [supabase.com](https://supabase.com)
3. **Railway** (Free $5 credit): [railway.app](https://railway.app)

Get your connection details and add them to Vercel environment variables.

### Step 5: Run Database Migrations

After the database is set up, you need to create the tables.

**Method 1: Using Vercel Postgres Dashboard**

1. Go to your Vercel project → Storage → Your Database
2. Click "Query" or ".sql" editor
3. Copy and paste this SQL:

```sql
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  datetime TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
```

4. Click "Run" or "Execute"

**Method 2: Using psql (if you have PostgreSQL client)**

```bash
psql "your-connection-string-here" -f src/db/setup.sql
```

### Step 6: Deploy

1. Click "Deploy"
2. Wait for the build to complete (1-2 minutes)
3. Your app will be live at `your-project-name.vercel.app`

### Step 7: Test Your Deployment

1. Visit your Vercel URL
2. Try registering a new user
3. Create an event
4. Register for the event

## Option 2: Deploy via CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

```bash
cd /home/ruxir/dev/surefy-assignment
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? `surefy-assignment`
- In which directory is your code located? `./`
- Want to override settings? **N**

### Step 4: Set Environment Variables

```bash
vercel env add DB_USER production
vercel env add DB_HOST production
vercel env add DB_NAME production
vercel env add DB_PASSWORD production
vercel env add DB_PORT production
vercel env add SESSION_SECRET production
vercel env add NODE_ENV production
```

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `eventuser` |
| `DB_HOST` | PostgreSQL host | `ep-cool-morning-123456.us-east-1.postgres.vercel-storage.com` |
| `DB_NAME` | Database name | `eventdb` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `SESSION_SECRET` | Secret for session encryption | `generate-random-64-char-string` |
| `NODE_ENV` | Environment | `production` |

## Generate a Secure Session Secret

Run this to generate a secure random session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Build Fails

**Error:** "Cannot find module"
- **Solution:** Make sure all dependencies are in `package.json`

**Error:** TypeScript errors
- **Solution:** Run `npm run lint:types` locally to fix type errors first

### Database Connection Issues

**Error:** "Connection refused"
- **Solution:** Check your database environment variables are correct
- Make sure your database allows connections from Vercel IPs (most services allow by default)

**Error:** "relation does not exist"
- **Solution:** You haven't run the database migrations. Go to Step 5 above.

### Session Issues

**Error:** "Session not persisting"
- **Solution:** Make sure `SESSION_SECRET` is set in environment variables
- For production, ensure `cookie.secure` is handled properly (already configured in code)

### Application Not Loading

**Error:** "Internal Server Error"
- **Solution:** Check Vercel logs (Project → Deployments → Click deployment → Runtime Logs)

## Updating Your Deployment

After making changes to your code:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. Vercel will automatically redeploy (if auto-deployment is enabled)

Or manually redeploy:
```bash
vercel --prod
```

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the instructions to configure DNS

## Monitoring

- **View Logs:** Vercel Dashboard → Your Project → Runtime Logs
- **View Analytics:** Vercel Dashboard → Your Project → Analytics
- **Database Monitoring:** Storage → Your Database → Monitoring

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **This Project:** [github.com/ruxir-ig/surefy-assignment](https://github.com/ruxir-ig/surefy-assignment)

## Cost

- **Vercel:** Free tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Edge network

- **Vercel Postgres:** Free tier includes:
  - 256MB storage
  - 60 hours compute/month
  - Perfect for development/small projects

For production with more traffic, consider upgrading to Vercel Pro ($20/month).
