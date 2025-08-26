# Deploying to Vercel and Connecting align-logic.com

This guide provides step-by-step instructions for deploying the Align Logic Driver Job Selection System to Vercel and connecting the align-logic.com domain.

## 1. Deploy to Vercel

### Option A: Deploy from GitHub

1. Push the code to a GitHub repository
2. Sign up or log in to Vercel: https://vercel.com
3. Click "Add New" > "Project"
4. Connect to your GitHub account and select the repository
5. Configure the project with these settings:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install
6. Click "Deploy"

### Option B: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Navigate to the project directory and deploy:
   ```
   vercel
   ```

4. Follow the CLI prompts to complete the deployment

## 2. Connect align-logic.com Domain (Squarespace)

### Step 1: Add Domain in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Click "Add" and enter: align-logic.com
4. Vercel will provide DNS records to configure

### Step 2: Configure Squarespace DNS

1. Log in to your Squarespace account
2. Go to "Settings" > "Domains"
3. Select align-logic.com
4. Navigate to "Advanced DNS Settings"
5. Add the following records:

   For the apex domain (align-logic.com):
   - Type: A
   - Name: @
   - Value: 76.76.21.21 (Vercel's load balancer IP)
   - TTL: 3600 (or Automatic)

   For the www subdomain (optional):
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com.
   - TTL: 3600 (or Automatic)

6. Save changes

### Step 3: Verify Connection

1. In Vercel, refresh the domain settings page
2. Wait for DNS verification (may take up to 48 hours)
3. Verify the "Valid Configuration" status
4. Test the domain by navigating to https://align-logic.com

## 3. Post-Deployment Verification

Verify these key elements are working correctly:

1. UPS company with Jacksonville (JACFL) and Dallas (DALTX) sites
2. Admin logins with separate credentials for each site
3. Driver redirect by employee ID to correct job boards
4. All critical functionality from the development preview

## 4. SSL Certificate

Vercel automatically provisions and renews SSL certificates. Verify that your site is accessible via HTTPS.

## 5. Custom Domains and Redirects

If you want to set up redirects (e.g., www to non-www), you can do this in Vercel:

1. Go to "Settings" > "Domains"
2. Click on your domain
3. Add redirects as needed

## Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs for build errors
2. Verify DNS configuration is correct
3. Try clearing your browser cache
4. Check browser developer console for JavaScript errors

## Support

For assistance with Vercel deployment:
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/help

For domain configuration help with Squarespace:
- Squarespace Help: https://support.squarespace.com/hc/en-us/articles/205812348-Advanced-DNS-settings