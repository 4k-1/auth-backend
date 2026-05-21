const fs = require('fs');
const path = require('path');

const filesToCopy = ['.env', 'config.json', 'swagger.yaml'];  // ✅ ADD THIS

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(__dirname, 'dist', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file} to dist/`);
  } else {
    console.log(`⚠️ ${file} not found`);
  }
});