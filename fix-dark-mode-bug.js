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
  // Fix double dark mode backgrounds
  { regex: /dark:bg-slate-900 dark:bg-slate-100/g, replacement: 'dark:bg-slate-900' },
  { regex: /dark:bg-slate-800 dark:bg-slate-100/g, replacement: 'dark:bg-slate-800' },
  
  // Fix background F8FAFC missing dark mode
  { regex: /bg-\[\#F8FAFC\](?!\s*dark:)/g, replacement: 'bg-[#F8FAFC] dark:bg-[#0F172A]' },
  
  // Fix text colors double dark
  { regex: /dark:text-slate-400 dark:text-slate-500/g, replacement: 'dark:text-slate-400' },
  { regex: /dark:text-white dark:text-slate-100/g, replacement: 'dark:text-white' },
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

console.log(`\nFinished fixing double dark mode classes. ${changedFiles} files updated.`);
