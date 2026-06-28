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

  // Change <label> to font-semibold
  content = content.replace(/<label([^>]*)font-bold([^>]*)>/g, '<label$1font-semibold$2>');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated label typography: ${filePath}`);
  }
}

walkDir('./app', processFile);
console.log("Label typography update complete.");
