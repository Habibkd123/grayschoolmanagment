const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Only target files that have the action menu pattern
  if (content.includes('actionMenuId') && content.includes('overflow-x-auto')) {
    // Replace <div className="overflow-x-auto"> with dynamic class
    const before = content;
    
    // Some might have just "overflow-x-auto", some might have other classes.
    // Let's replace the exact string if it's there.
    content = content.replace(
      /<div className="overflow-x-auto">/g, 
      '<div className={`overflow-x-auto ${actionMenuId ? \'pb-28\' : \'\'}`}>'
    );
    
    // Also handle `<div className="overflow-x-auto w-full">` if it exists
    content = content.replace(
      /<div className="overflow-x-auto w-full">/g, 
      '<div className={`overflow-x-auto w-full ${actionMenuId ? \'pb-28\' : \'\'}`}>'
    );
    
    // Also handle `<div className="overflow-x-auto bg-white rounded-lg shadow">` etc if they exist
    // But safely using Regex for any overflow-x-auto that isn't already dynamic
    content = content.replace(
      /className="overflow-x-auto([^"]*)"/g,
      "className={`overflow-x-auto$1 ${actionMenuId ? 'pb-28' : ''}`}"
    );

    if (content !== before) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed:', file);
      modifiedCount++;
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
