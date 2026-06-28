const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx')) {
      callback(path.join(dirPath));
    }
  });
}

const replacements = [
  // Backgrounds
  { regex: /bg-white(?!\/| dark:)/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /bg-slate-50(?!\/| dark:)/g, replacement: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /bg-slate-100(?!\/| dark:)/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /bg-slate-900(?!\/| dark:)/g, replacement: 'bg-slate-900 dark:bg-slate-100' },
  
  // Borders
  { regex: /border-slate-200(?!\/| dark:)/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { regex: /border-slate-100(?!\/| dark:)/g, replacement: 'border-slate-100 dark:border-slate-800/50' },
  { regex: /border-border\/60(?!\s*dark:)/g, replacement: 'border-border/60 dark:border-slate-800' },
  
  // Text Colors
  { regex: /text-slate-900(?!\/| dark:)/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /text-slate-800(?!\/| dark:)/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { regex: /text-\[\#202c4b\](?!\/| dark:)/g, replacement: 'text-[#202c4b] dark:text-slate-100' },
  { regex: /text-slate-700(?!\/| dark:)/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { regex: /text-slate-600(?!\/| dark:)/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /text-slate-500(?!\/| dark:)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-400(?!\/| dark:)/g, replacement: 'text-slate-400 dark:text-slate-500' },
  
  // Specific auth layout left-side overlays
  { regex: /bg-\[\#5D6BEE\]\/80/g, replacement: 'bg-[#5D6BEE]/80 dark:bg-slate-900/80' },
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

console.log(`\nFinished refactoring. ${changedFiles} files updated.`);
