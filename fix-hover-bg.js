const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(path.join(dirPath));
    }
  });
}

const replacements = [
  // Hover Backgrounds missing dark
  { regex: /hover:bg-slate-50\/80(?!\s*dark:)/g, replacement: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' },
  { regex: /hover:bg-slate-50(?!\/| dark:)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
  { regex: /hover:bg-slate-100(?!\/| dark:)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { regex: /bg-slate-50\/50(?!\s*dark:)/g, replacement: 'bg-slate-50/50 dark:bg-slate-800/50' },
  
  // Also clean up any double dark classes that might occur from re-running
  { regex: /dark:hover:bg-slate-800\/50 dark:hover:bg-slate-800\/50/g, replacement: 'dark:hover:bg-slate-800/50' },
  { regex: /dark:hover:bg-slate-800 dark:hover:bg-slate-800/g, replacement: 'dark:hover:bg-slate-800' },
  { regex: /dark:bg-slate-800\/50 dark:bg-slate-800\/50/g, replacement: 'dark:bg-slate-800/50' },
];

let changedFiles = 0;

walkDir('./app', function(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log(`Updated: ${filePath}`);
  }
});

console.log(`\nFinished fixing hover dark mode classes. ${changedFiles} files updated.`);
