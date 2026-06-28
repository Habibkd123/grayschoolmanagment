const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/hover:bg-slate-50 dark:bg-slate-800\/50/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/50');
    // Also fixing text color on hover if needed.
    // The user mentioned "dark mode mai btn or text dono hi white ho jate hia"
    // So "hover:bg-slate-50 dark:hover:bg-slate-800/50" makes the button dark bg, which is correct for dark mode hover.
    // The text in those cases is usually `dark:text-slate-200` or `dark:text-slate-100`. So it will be white text on dark background, which is correct!
    // The problem was `dark:bg-slate-800/50` making it ALWAYS dark background, but hovering added `hover:bg-slate-50` (light bg) because `dark:bg-slate-800/50` isn't a hover state. So on hover it became light bg with light text!
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
