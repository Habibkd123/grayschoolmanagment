const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'app/dashboard'),
  path.join(__dirname, 'app/components'),
  path.join(__dirname, 'app/globals.css')
];

const replacements = [
  { search: /#5D6BEE/gi, replace: '#F59E0B' }, // Primary Blue -> Saffron Gold
  { search: /#4b58ce/gi, replace: '#D97706' }, // Hover Blue -> Darker Gold
  { search: /#202c4b/gi, replace: '#0F172A' }, // Dark Blue -> Navy Blue
  { search: /#1e293b/gi, replace: '#0F172A' }, // Slate 800 -> Navy Blue
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.search, rule.replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

// Also process globals.css directly if passed
directories.forEach(dir => {
  if (dir.endsWith('.css')) {
     if (fs.existsSync(dir)) {
       let content = fs.readFileSync(dir, 'utf8');
       let originalContent = content;
       for (const rule of replacements) {
         content = content.replace(rule.search, rule.replace);
       }
       if (content !== originalContent) {
         fs.writeFileSync(dir, content, 'utf8');
         console.log(`Updated: ${dir}`);
       }
     }
  } else {
    processDirectory(dir);
  }
});

console.log("Theme applied successfully!");
