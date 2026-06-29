const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/habib/OneDrive/Documents/schools/greenwood/school-management/app/(website)';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Match section: change bg-[var(--sidebar-bg)] to bg-white
  content = content.replace(
    /(<section[^>]*class(?:Name)?="[^"]*)\bbg-\[var\(--sidebar-bg\)\]\b([^"]*")/g,
    '$1bg-white$2'
  );

  // 2. Match img opacity: remove opacity-20
  content = content.replace(
    /(<img[^>]*class(?:Name)?="[^"]*)\bopacity-20\b([^"]*")/g,
    '$1$2'
  );

  // 3. Match the gradient overlay div
  content = content.replace(
    /<div\s+class(?:Name)?="absolute inset-0 bg-gradient-to-b from-\[#0F172A\]\/80 to-\[#0F172A\]"\s*(?:\/>|<\/div>)/g,
    '<div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: "color-mix(in oklab, #ffffff6b 90%, transparent)" }} />'
  );

  // 4. Match the badge styling
  // bg-primary/20 border border-primary/30 text-[#FCA5A5] -> bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]
  content = content.replace(
    /\bbg-primary\/20\b/g,
    "bg-[var(--primary)]/10"
  ).replace(
    /\bborder-primary\/30\b/g,
    "border-[var(--primary)]/20"
  ).replace(
    /\btext-\[#FCA5A5\]\b/g,
    "text-[var(--primary)]"
  );

  // 5. Match h1 styling: change text-white to text-[#231F20] font-sans font-black
  content = content.replace(
    /(<h1[^>]*class(?:Name)?="[^"]*)\btext-white\b([^"]*")/g,
    '$1text-[#231F20] font-sans font-black$2'
  );
  content = content.replace(
    /(<h1[^>]*class(?:Name)?="[^"]*)\bfont-serif\b([^"]*")/g,
    '$1$2'
  );

  // 6. Match p styling: change text-slate-400 to text-slate-600
  content = content.replace(
    /(<p[^>]*class(?:Name)?="[^"]*)\btext-slate-400\b([^"]*")/g,
    '$1text-slate-600$2'
  );

  // 7. Match calendar icon styling (Calendar className="w-4 h-4 text-primary" -> text-[var(--primary)])
  content = content.replace(
    /(<Calendar[^>]*class(?:Name)?="[^"]*)\btext-primary\b([^"]*")/g,
    '$1text-[var(--primary)]$2'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated Banner in:', path.relative(targetDir, filePath));
  }
}

function traverse(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      traverse(full);
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      processFile(full);
    }
  }
}

console.log('Processing TSX files under (website) directory...');
traverse(targetDir);
console.log('Finished.');
