const fs = require('fs');
const path = require('path');

// swagger.yaml is at root, copy to dist/
const src = path.join(__dirname, 'swagger.yaml');
const dest = path.join(__dirname, 'dist/swagger.yaml');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✅ Copied swagger.yaml to dist/');
} else {
  console.log('⚠️ swagger.yaml not found in root');
}