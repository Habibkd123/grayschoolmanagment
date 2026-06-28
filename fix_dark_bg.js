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
    let original = content;

    content = content.replace(/className="([^"]*bg-\[\#F1F5F9\][^"]*)"/g, (match, classes) => {
      let newClasses = classes;
      if (!newClasses.includes('dark:bg-')) {
        newClasses = newClasses.replace('bg-[#F1F5F9]', 'bg-[#F1F5F9] dark:bg-slate-800');
      }
      if (!newClasses.includes('dark:hover:bg-')) {
        if (newClasses.includes('hover:bg-[#E2E8F0]')) {
           newClasses = newClasses.replace('hover:bg-[#E2E8F0]', 'hover:bg-[#E2E8F0] dark:hover:bg-slate-700');
        } else if (newClasses.includes('hover:bg-slate-200')) {
           newClasses = newClasses.replace('hover:bg-slate-200', 'hover:bg-slate-200 dark:hover:bg-slate-700');
        }
      }
      return `className="${newClasses}"`;
    });

    content = content.replace(/className=\{`([^`]*)`\}/g, (match, classes) => {
      let newClasses = classes;
      if (newClasses.includes('bg-[#F1F5F9]')) {
          if (!newClasses.includes('dark:bg-')) {
            newClasses = newClasses.replace('bg-[#F1F5F9]', 'bg-[#F1F5F9] dark:bg-slate-800');
          }
          if (!newClasses.includes('dark:hover:bg-')) {
            if (newClasses.includes('hover:bg-[#E2E8F0]')) {
               newClasses = newClasses.replace('hover:bg-[#E2E8F0]', 'hover:bg-[#E2E8F0] dark:hover:bg-slate-700');
            } else if (newClasses.includes('hover:bg-slate-200')) {
               newClasses = newClasses.replace('hover:bg-slate-200', 'hover:bg-slate-200 dark:hover:bg-slate-700');
            }
          }
      }
      return `className={\`${newClasses}\`}`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
