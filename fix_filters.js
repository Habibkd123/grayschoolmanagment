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

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to match the Reset button in Filter
  // Looks for <button className="..." ...>Reset</button> 
  // We only want to replace if it doesn't already have onClick
  
  content = content.replace(/<button([^>]*?)>(\s*Reset\s*)<\/button>/g, (match, p1, p2) => {
    if (p1.includes('onClick')) return match;
    return `<button onClick={() => setIsFilterOpen(false)}${p1} cursor-pointer>${p2}</button>`;
  });

  // Also do it for Apply button
  content = content.replace(/<button([^>]*?)>(\s*Apply\s*)<\/button>/g, (match, p1, p2) => {
    if (p1.includes('onClick')) return match;
    return `<button onClick={() => setIsFilterOpen(false)}${p1} cursor-pointer>${p2}</button>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Modified:', file);
  }
});

console.log('Total files modified:', modifiedCount);
