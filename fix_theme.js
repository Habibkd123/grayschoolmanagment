const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app/dashboard/reports', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/bg-\[\#3B82F6\]/g, 'bg-[#F59E0B]');
    content = content.replace(/bg-\[\#5D6BEE\]/g, 'bg-[#F59E0B]');
    content = content.replace(/hover:bg-\[\#4b58ce\]/g, 'hover:bg-[#D97706]');
    content = content.replace(/bg-blue-500/g, 'bg-[#F59E0B]');
    content = content.replace(/hover:bg-blue-600/g, 'hover:bg-[#D97706]');
    
    // For sorting where "Ascending" is blue
    content = content.replace(/bg-\[\#3B82F6\] text-white/g, 'bg-[#F59E0B] text-white');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
