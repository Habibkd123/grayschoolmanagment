const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/habib/OneDrive/Documents/schools/greenwood/school-management/app/(website)';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replaces the image class and inserts the blur/scale styles
  // Matches object-cover with or without trailing spaces
  content = content.replace(
    /className="w-full h-full object-cover\s*"/g,
    'className="w-full h-full object-cover" style={{ filter: "blur(3px)", transform: "scale(1.05)" }}'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Added blur to image in:', path.relative(targetDir, filePath));
  }
}

function traverse(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      traverse(full);
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      processFile(full);
    }
  }
}

traverse(targetDir);
console.log('Finished blur application.');
