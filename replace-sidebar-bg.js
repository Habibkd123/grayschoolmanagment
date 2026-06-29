const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/habib/OneDrive/Documents/schools/greenwood/school-management/app/(website)';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace bg-[var(--sidebar-bg)] with bg-white without \b boundary
  content = content.replace(
    /bg-\[var\(--sidebar-bg\)\]/g,
    'bg-white'
  );

  // Also fix text-[#FCA5A5] if it remained due to \b boundary
  content = content.replace(
    /text-\[#FCA5A5\]/g,
    'text-[var(--primary)]'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed background in:', path.relative(targetDir, filePath));
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
console.log('Finished background fixes.');
