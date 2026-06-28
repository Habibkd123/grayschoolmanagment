const fs = require('fs');
const path = require('path');

const files = [
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/forget-password/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace #5D6BEE with primary
    content = content.replace(/bg-\[\#5D6BEE\]/g, 'bg-primary');
    content = content.replace(/text-\[\#5D6BEE\]/g, 'text-primary');
    content = content.replace(/border-\[\#5D6BEE\]/g, 'border-primary');
    
    // Replace hover variants
    content = content.replace(/hover:bg-\[\#4b58ce\]/g, 'hover:bg-primary/90');
    content = content.replace(/hover:text-\[\#4b58ce\]/g, 'hover:text-primary/80');

    // Also the avatar API call uses 5D6BEE
    content = content.replace(/background=5D6BEE/g, 'background=F59E0B');

    // Replace the dark blue text color #202c4b with slate-900
    content = content.replace(/text-\[\#202c4b\]/g, 'text-slate-900');

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
