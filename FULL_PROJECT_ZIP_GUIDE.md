# Full Project ZIP Guide for Current Preview Version

This guide helps you create a complete ZIP file containing all necessary project files for the current preview version of the Job Selection System.

## Files to Include in Your ZIP

### Root Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.app.json` - App-specific TypeScript configuration
- `tsconfig.node.json` - Node-specific TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui component configuration
- `vercel.json` - Deployment configuration
- `index.html` - Main HTML entry point
- `README.md` - Project documentation

### Source Code (Include entire `src` directory)
All files in the `src` folder should be included, such as:
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles
- All components, pages, hooks, utils, and store files

### Public Assets (Include entire `public` directory)
- `public/favicon.svg` - Website favicon
- `public/robots.txt` - SEO optimization
- `public/sitemap.xml` - Search engine indexing
- Other public assets

### Build Output (Include if needed for reference)
- `dist/` directory - Contains the compiled application

### Documentation
- `.devv/` directory - Contains project documentation
- `DEPLOY_VERCEL.md` - Deployment instructions
- `USER_GUIDE.md` - User documentation
- Any other documentation files

## Creating the ZIP File

### Method 1: Using a File Explorer
1. Create a new folder (e.g., `jss-project-full`)
2. Copy all the files and directories listed above into this folder
3. Right-click the folder and select "Compress" or "Send to > Compressed (zipped) folder"

### Method 2: Using Command Line (on systems with zip command)
```bash
# Navigate to your project directory
cd /path/to/your/project

# Create a ZIP file with all project contents
zip -r jss-project-full.zip . -x "node_modules/*" "*.git*"
```

### Method 3: Using Node.js Script
You can use the existing `create-production-zip.js` script as a reference, but modify it to include all files instead of filtering out development files.

## After Creating the ZIP

Once you have the full project ZIP:
1. Extract it to a clean directory
2. Run `npm install` to install dependencies
3. Run `npm run dev` to verify the development version works
4. Create a production build with `npm run build`

The resulting ZIP file will contain the complete project, allowing you to create the production build as needed.