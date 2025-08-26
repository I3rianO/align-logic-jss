# Step-by-Step Guide to Create a Cleaned Production ZIP

This guide will help you create a clean production-ready ZIP file for deploying your Job Selection System application to GitHub and Vercel for the align-logic.com domain.

## Step 1: Create a Fresh Working Directory

1. Create a new empty folder on your computer called `align-logic-production`
2. This will be your working directory where you'll gather only the necessary production files

## Step 2: Copy Required Files and Folders

Copy the following files and folders from your source project to the new working directory:

### Core Configuration Files
- `package.json` (contains dependencies and build scripts)
- `vite.config.ts` (configured with base: "/")
- `tailwind.config.js` (styling configuration)
- `tsconfig.json` (TypeScript configuration)
- `vercel.json` (SPA routing for Vercel)
- `postcss.config.js` (for CSS processing)
- `index.html` (entry HTML file)
- `components.json` (shadcn/ui components configuration)

### Source Code and Assets
- Copy the entire `/src` folder (contains all application code)
- Copy the entire `/public` folder (contains static assets)

### Documentation Files
- `README.md` (project overview)
- `DEPLOY_VERCEL.md` (deployment instructions)
- `PRODUCTION_DEPLOYMENT.md` (production notes)

### Pre-built Distribution (if available)
- Copy the entire `/dist` folder (contains optimized build output)

## Step 3: Clean Up Restoration and Dev Files

Remove the following files from your working copy:

1. Delete ALL restoration utility files:
   - `src/utils/emergencyFix.ts`
   - `src/utils/forceInitJACFL.ts`
   - `src/utils/directStorageRestore.ts` 
   - `src/utils/directUPSJACFLRestore.ts`
   - `src/utils/criticalSiteRestore.ts`
   - `src/utils/restore-app-wrapper.tsx`
   - `public/jacfl-restore.js`

2. Delete development configuration files:
   - `eslint.config.js`
   - `tsconfig.app.json`
   - `tsconfig.node.json`

3. Delete temporary production preparation files:
   - `files-to-remove.txt`
   - `production-files-list.txt`
   - `production-zip-description.md`
   - `production-zip-guide.md`
   - `PRODUCTION_ZIP_CONTENTS.md`
   - `PRODUCTION_SUMMARY.md`
   - Any files with "TEST" in the name

4. Ensure the public folder is clean:
   - Remove `public/apple-touch-icon.png.txt` and create a proper `public/apple-touch-icon.png`
   - Make sure favicon.svg is properly formatted

## Step 4: Create a Clean ZIP Archive

1. Select all files and folders in your working directory
2. Right-click and select "Compress" or use your preferred ZIP utility
3. Name the archive `align-logic-production.zip`

## Step 5: Verify ZIP Contents

Before uploading, verify that your ZIP contains only:

✅ **Included Files and Directories**
- `/src` (complete application code)
- `/public` (static assets)
- `/dist` (if available - pre-built application)
- Configuration files (package.json, vite.config.ts, etc.)
- Documentation files (README.md, DEPLOY_VERCEL.md, PRODUCTION_DEPLOYMENT.md)

❌ **Confirm these are NOT included**
- `.devv/` directory and any dev documentation
- Restoration utility files
- Local/offline references or .exe files
- Test scripts and unnecessary development files

## Step 6: Upload to GitHub and Deploy

1. Create a new repository on GitHub
2. Upload the ZIP and extract its contents, or push the extracted content directly
3. Connect to Vercel and point to this GitHub repository
4. Configure the domain settings for align-logic.com

## Optional: Automation Script

If you prefer to automate this process, you can use the following script. Create a file called `create-production-zip.js`:

```javascript
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Create a production directory
const sourceDir = process.cwd();
const prodDir = path.join(sourceDir, 'production-build');

// Clean or create production directory
fs.removeSync(prodDir);
fs.ensureDirSync(prodDir);

// Files and directories to copy
const filesToCopy = [
  'package.json',
  'vite.config.ts',
  'tailwind.config.js',
  'tsconfig.json',
  'vercel.json',
  'postcss.config.js',
  'index.html',
  'components.json',
  'README.md',
  'DEPLOY_VERCEL.md',
  'PRODUCTION_DEPLOYMENT.md'
];

const dirsToRecursivelyCopy = [
  'src',
  'public',
  'dist'
];

// Files to exclude from src/utils
const utilsToExclude = [
  'emergencyFix.ts',
  'forceInitJACFL.ts',
  'directStorageRestore.ts',
  'directUPSJACFLRestore.ts',
  'criticalSiteRestore.ts',
  'restore-app-wrapper.tsx'
];

// Copy individual files
filesToCopy.forEach(file => {
  if (fs.existsSync(path.join(sourceDir, file))) {
    fs.copySync(
      path.join(sourceDir, file),
      path.join(prodDir, file)
    );
    console.log(`Copied: ${file}`);
  } else {
    console.log(`Warning: ${file} not found`);
  }
});

// Copy directories
dirsToRecursivelyCopy.forEach(dir => {
  if (fs.existsSync(path.join(sourceDir, dir))) {
    fs.copySync(
      path.join(sourceDir, dir),
      path.join(prodDir, dir),
      {
        filter: (src) => {
          // Exclude restoration utility files
          if (src.includes('src/utils')) {
            const filename = path.basename(src);
            if (utilsToExclude.includes(filename)) {
              console.log(`Excluding: ${src}`);
              return false;
            }
          }
          // Exclude jacfl-restore.js
          if (src.includes('public/jacfl-restore.js')) {
            console.log(`Excluding: ${src}`);
            return false;
          }
          return true;
        }
      }
    );
    console.log(`Copied directory: ${dir}`);
  } else {
    console.log(`Warning: Directory ${dir} not found`);
  }
});

// Create a production zip file
const output = fs.createWriteStream(path.join(sourceDir, 'align-logic-production.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  console.log(`Production ZIP created successfully! (${archive.pointer()} total bytes)`);
  console.log('File: align-logic-production.zip');
  
  // Clean up production directory
  fs.removeSync(prodDir);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(prodDir, false);
archive.finalize();

console.log('Creating production ZIP...');
```

To use this script:
1. Install dependencies: `npm install fs-extra archiver`
2. Run the script: `node create-production-zip.js`
3. The script will create align-logic-production.zip in your project root