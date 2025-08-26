# Production ZIP Creation Guide

This guide outlines how to create the final cleaned production ZIP file for the Job Selection System.

## Files to Include

1. **Essential Configuration Files**
   - index.html
   - package.json
   - vite.config.ts
   - tsconfig.json
   - tailwind.config.js
   - postcss.config.js
   - components.json
   - vercel.json

2. **Application Source Code**
   - Complete `src/` directory
   - `public/` directory with production assets:
     - favicon.svg
     - robots.txt
     - sitemap.xml

3. **Build Output**
   - `dist/` directory (contains the compiled application)

4. **Production Documentation**
   - README.md
   - USER_GUIDE.md
   - PRODUCTION_DEPLOYMENT.md
   - DEPLOY_VERCEL.md

## Files to Exclude

1. **Development Documentation**
   - All files in `.devv/` directory

2. **Development Tools and Utilities**
   - Any launcher scripts or executables
   - Development-only utilities in `src/utils/` such as:
     - emergencyFix.ts
     - forceInitJACFL.ts
     - directStorageRestore.ts

3. **Test Files**
   - Any test scripts or test-specific files

4. **Local Development Configurations**
   - Local environment files

## How to Create the Production ZIP

1. Create a clean copy of the project
2. Remove all development-only files listed above
3. Ensure the `dist/` directory contains a production build
4. ZIP the cleaned directory

## Production Build Verification

Before zipping, ensure:
- All features work in the production build
- No development code or console logs remain
- Site metadata and SEO settings are correct
- Favicons and other assets are properly configured

## Final Production ZIP Content

The final ZIP file should be named `job-selection-system-production.zip` and contain only the essential files needed for deployment to a production environment like Vercel.