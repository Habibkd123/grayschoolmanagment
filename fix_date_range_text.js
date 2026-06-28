const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app/dashboard', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let lines = content.split('\n');
    let newLines = lines.map(line => {
      // Do not replace the default state value
      if (line.includes('useState("')) {
        return line;
      }
      return line.replace(/06\/0[12]\/2026 - 06\/0[78]\/2026/g, '{selectedDateRange}');
    });

    content = newLines.join('\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
