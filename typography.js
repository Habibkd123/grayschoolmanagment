const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Section Titles (h2, h3, h4) to font-semibold (600)
  content = content.replace(/<(h[2-6])([^>]*)font-bold([^>]*)>/g, '<$1$2font-semibold$3>');

  // 2. Table Headers (th) to font-semibold (600)
  content = content.replace(/<th([^>]*)font-bold([^>]*)>/g, '<th$1font-semibold$2>');

  // 3. Buttons (button) to font-semibold (600)
  content = content.replace(/<button([^>]*)font-bold([^>]*)>/g, '<button$1font-semibold$2>');
  
  // 4. Links (a, Link) acting as buttons
  content = content.replace(/<Link([^>]*)font-bold([^>]*)>/g, '<Link$1font-semibold$2>');

  // 5. Body Text (p, td, div) - remove font-medium to fallback to 400
  // Note: we'll carefully target classNames with font-medium
  content = content.replace(/<(p|td|div|span)([^>]*)font-medium([^>]*)>/g, function(match, p1, p2, p3) {
    // Keep font-medium if it's inside a select or input? Let's just remove it for body text
    return `<${p1}${p2}${p3}>`;
  });
  
  // Also clean up any double spaces in classNames
  content = content.replace(/ className="([^"]*)"/g, (match, p1) => {
      return ` className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./app', processFile);
console.log("Typography update complete.");
