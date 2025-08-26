# Job Selection System - Production ZIP Contents

This document outlines the contents of the production ZIP file for the Job Selection System.

## Included Files and Directories

### Root Directory Files
- `index.html` - Main HTML entry point
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui configuration
- `vercel.json` - Vercel deployment configuration
- `README.md` - Project overview
- `USER_GUIDE.md` - User documentation
- `PRODUCTION_DEPLOYMENT.md` - Deployment instructions
- `DEPLOY_VERCEL.md` - Vercel-specific deployment guide

### Source Code
- Complete `src/` directory with:
  - Components
  - Pages
  - Stores
  - Utils (production-necessary utilities only)
  - Hooks
  - Styles

### Public Assets
- `public/` directory containing:
  - `favicon.svg` - Site favicon
  - `robots.txt` - Search engine crawling rules
  - `sitemap.xml` - Site structure for search engines

### Build Output
- `dist/` directory containing:
  - Compiled JavaScript
  - Minified CSS
  - Optimized assets

## Cleaned Up (Removed)

### Development Files
- All `.devv/` directory files
- Development-only utility scripts
- Test files and documentation
- Local launch scripts and configurations
- Emergency restoration scripts
- Development configuration files

### Build Tools
- `eslint.config.js` - Linting configuration
- `tsconfig.app.json` and `tsconfig.node.json` - Additional TypeScript configs

## Key Features Preserved

1. **UPS Company Sites**
   - Jacksonville (JACFL) site configuration
   - Dallas (DALTX) site configuration

2. **Authentication**
   - Site-specific admin credentials
   - Employee ID routing system

3. **Core Functionality**
   - Driver management
   - Job management
   - Job selection process
   - Vacation management
   - Reporting and analytics

The ZIP file represents a complete, production-ready build that can be deployed directly to a web hosting platform like Vercel and connected to the align-logic.com domain.