const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'app', 'dashboard'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Match the filter popup buttons: <button ...>Reset</button>
  const resetRegex = /<button([^>]*?)>(\s*Reset\s*)<\/button>/g;
  let match;
  while ((match = resetRegex.exec(content)) !== null) {
    if (!match[1].includes('onClick')) {
      console.log('Missing onClick for Reset in:', file);
    }
  }

  const applyRegex = /<button([^>]*?)>(\s*Apply\s*)<\/button>/g;
  while ((match = applyRegex.exec(content)) !== null) {
    if (!match[1].includes('onClick')) {
      console.log('Missing onClick for Apply in:', file);
    }
  }
});
