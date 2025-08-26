const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// If you don't have archiver installed, run: npm install archiver

// Configuration
const outputZip = 'jss-project-full.zip';
const excludedPaths = [
  'node_modules',
  '.git',
  outputZip // Exclude the output file itself
];

console.log('Creating full project ZIP file...');

// Create output stream
const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for archive events
output.on('close', () => {
  console.log(`✅ ZIP file created successfully: ${outputZip}`);
  console.log(`   Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the output file
archive.pipe(output);

// Get all files and directories in the project
function addDirectory(dirPath, basePath = '') {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    
    // Check if path should be excluded
    if (excludedPaths.some(excludedPath => 
        fullPath.includes(path.sep + excludedPath) || 
        fullPath === excludedPath)) {
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Add directory recursively
      addDirectory(fullPath, relativePath);
    } else {
      // Add file to archive
      archive.file(fullPath, { name: relativePath });
      console.log(`Adding: ${relativePath}`);
    }
  });
}

// Add all project files (except excluded paths)
addDirectory(process.cwd());

// Finalize the archive
archive.finalize();