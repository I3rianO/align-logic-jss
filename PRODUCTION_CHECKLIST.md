# Production Deployment Checklist

Use this checklist to verify your production ZIP before uploading to GitHub and deploying to align-logic.com via Vercel.

## ✅ Required Files and Directories

### Core Configuration Files
- [ ] `package.json` - Dependencies and scripts
- [ ] `vite.config.ts` - Vite configuration (with base: "/")
- [ ] `tailwind.config.js` - Tailwind CSS configuration
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `vercel.json` - Vercel routing configuration
- [ ] `postcss.config.js` - PostCSS configuration
- [ ] `index.html` - Main HTML entry point
- [ ] `components.json` - shadcn/ui components config

### Source Code
- [ ] `/src` directory with all application code
  - [ ] `/components` - UI components
  - [ ] `/hooks` - React hooks
  - [ ] `/lib` - Utility functions
  - [ ] `/pages` - Application pages
  - [ ] `/store` - State management
  - [ ] `App.tsx` - Main application component
  - [ ] `index.css` - Main stylesheet
  - [ ] `main.tsx` - Application entry point
  - [ ] `vite-env.d.ts` - TypeScript declarations

### Public Assets
- [ ] `/public` directory with static assets
  - [ ] `favicon.svg` - Site favicon
  - [ ] `robots.txt` - Search engine instructions
  - [ ] `sitemap.xml` - Site structure for search engines
  - [ ] `apple-touch-icon.png` - iOS icon

### Build Output (if available)
- [ ] `/dist` directory with optimized build

### Documentation
- [ ] `README.md` - Project overview
- [ ] `DEPLOY_VERCEL.md` - Vercel deployment instructions
- [ ] `PRODUCTION_DEPLOYMENT.md` - Production deployment guide

## ❌ Files to Verify Are NOT Included

### Development Documentation
- [ ] `.devv/` directory and all its contents
- [ ] Any files containing "TEST" or "test" in their names
- [ ] Files related to development setup

### Restoration Utilities
- [ ] `src/utils/emergencyFix.ts`
- [ ] `src/utils/forceInitJACFL.ts`
- [ ] `src/utils/directStorageRestore.ts`
- [ ] `src/utils/directUPSJACFLRestore.ts`
- [ ] `src/utils/criticalSiteRestore.ts`
- [ ] `src/utils/restore-app-wrapper.tsx`
- [ ] `public/jacfl-restore.js`

### Development Configuration
- [ ] `eslint.config.js`
- [ ] `tsconfig.app.json`
- [ ] `tsconfig.node.json`

### Temporary Files
- [ ] `files-to-remove.txt`
- [ ] `production-files-list.txt`
- [ ] `production-zip-description.md`
- [ ] `production-zip-guide.md`
- [ ] `PRODUCTION_ZIP_CONTENTS.md`
- [ ] `PRODUCTION_SUMMARY.md`

## Final Verification

- [ ] Open the ZIP file to visually inspect contents
- [ ] Verify that all source files are present and properly organized
- [ ] Confirm no development or restoration utilities are included
- [ ] Check that the vercel.json file is properly configured for SPA routing
- [ ] Verify package.json contains all necessary dependencies