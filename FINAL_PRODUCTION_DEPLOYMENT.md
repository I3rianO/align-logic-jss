# Job Selection System - Production Deployment

This document provides essential information for deploying the Job Selection System (JSS) production build.

## Production Build Contents

The production ZIP contains the following:

1. **Application Source Code**
   - Complete React application with TypeScript, Tailwind CSS, and shadcn/ui components
   - Optimized for web deployment

2. **Build Output**
   - Pre-compiled application in the `dist/` directory
   - Optimized JS and CSS bundles

3. **Configuration Files**
   - Vercel deployment configuration
   - Vite build settings
   - TypeScript configuration

4. **Public Assets**
   - Favicon and application icons
   - SEO-optimized metadata
   - Robots.txt and sitemap.xml

## Deployment Instructions

### Vercel Deployment (Recommended)

1. Log in to your Vercel account
2. Import the project from GitHub or upload the ZIP directly
3. Configure the following settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Deploy the application

### Domain Configuration for align-logic.com

If you're using Squarespace for domain management:

1. Log in to your Squarespace account
2. Navigate to Home → Settings → Domains
3. Select align-logic.com
4. Click "Advanced Settings"
5. Add the following DNS records:

   **A Record**
   - Name: @
   - Value: 76.76.21.21 (Vercel's IP)
   - TTL: Automatic

   **CNAME Record**
   - Name: www
   - Value: cname.vercel-dns.com.
   - TTL: Automatic

6. In your Vercel project:
   - Go to "Settings" → "Domains"
   - Add "align-logic.com" as your domain
   - Vercel will verify the DNS configuration

## Default Configuration

The production build includes:

1. **UPS Company Sites**
   - Jacksonville (JACFL)
   - Dallas (DALTX)

2. **Authentication System**
   - Site-specific admin passwords
   - Employee ID-based driver routing

3. **Features**
   - Job selection system
   - Driver management
   - Job management
   - Activity logging
   - Vacation selection

## Post-Deployment Verification

After deployment, verify:

1. Site loads correctly at align-logic.com
2. Admin login works for both JACFL and DALTX
3. Drivers correctly route to their specific job boards
4. All application features function properly

## Support

For any deployment issues or questions, refer to the included USER_GUIDE.md or contact system administration support.