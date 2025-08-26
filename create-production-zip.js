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