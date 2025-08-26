# Production Deployment Guide

This guide provides instructions for deploying the Align Logic Driver Job Selection System to Vercel and connecting it to the align-logic.com domain.

## Deployment Steps

### 1. Initial Vercel Setup

1. Create a Vercel account if you don't have one: https://vercel.com/signup
2. Install the Vercel CLI (optional for advanced usage):
   ```
   npm install -g vercel
   ```
3. Login to Vercel CLI:
   ```
   vercel login
   ```

### 2. Deploy to Vercel

#### Option A: Direct from Git Repository (Recommended)

1. Push this codebase to a GitHub/GitLab/Bitbucket repository
2. Login to the Vercel dashboard: https://vercel.com/dashboard
3. Click "New Project" and import the repository
4. Configure build settings:
   - Framework: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install
5. Click "Deploy"

#### Option B: Manual Deployment from Local

1. Navigate to the project directory
2. Run:
   ```
   vercel
   ```
3. Follow the interactive setup and deployment process

### 3. Domain Configuration

1. In the Vercel dashboard, navigate to your project
2. Go to "Settings" > "Domains"
3. Add your domain: align-logic.com
4. Vercel will provide you with DNS records that need to be added to your Squarespace domain management:

   - Type: A or CNAME record (follow Vercel's specific instructions)
   - Host: @ or www (depending on configuration)
   - Value: (provided by Vercel)
   - TTL: Automatic or 3600

5. Add the DNS records in your Squarespace domain management panel:
   - Log in to your Squarespace account
   - Go to Settings > Domains > [your domain] > Advanced DNS settings
   - Add the DNS records from Vercel

6. Wait for DNS propagation (can take up to 24-48 hours)
7. Verify domain connection in Vercel dashboard

### 4. Environment Configuration (Optional)

If you need environment variables for specific features:

1. In the Vercel dashboard, navigate to your project
2. Go to "Settings" > "Environment Variables"
3. Add any required variables (usually none needed for this application)

### 5. Verify Deployment

1. Once deployed, verify the following features are working:
   - UPS company with Jacksonville (JACFL) and Dallas (DALTX) sites are present
   - Admin login functions for each site independently
   - Driver redirect by employee ID works correctly
   - All site data is properly isolated

### 6. SSL/HTTPS Configuration

Vercel automatically provisions and renews SSL certificates. Verify that your site is accessible via HTTPS.

### 7. Post-Deployment Checks

- Check browser console for any errors
- Test on multiple devices and browsers
- Verify all routes work properly, including direct URL access to deeper pages

## DNS Records for Squarespace

When connecting your Squarespace domain to Vercel, you'll typically need to add these records:

1. For apex domain (align-logic.com):
   - Type: A
   - Name: @
   - Value: 76.76.21.21 (Vercel's load balancer IP)

2. For www subdomain (www.align-logic.com):
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com.

## Support

For deployment assistance, please contact:
- Vercel Support: https://vercel.com/help
- Application Developer Support: [your contact information]