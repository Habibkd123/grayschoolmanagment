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

    // 1. Add selectedDateRange state
    if (content.includes('const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);') && 
        !content.includes('const [selectedDateRange, setSelectedDateRange] = useState')) {
      content = content.replace(
        'const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);',
        'const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);\n  const [selectedDateRange, setSelectedDateRange] = useState("06/02/2026 - 06/08/2026");'
      );
    }

    // 2. Replace the hardcoded string next to the Calendar icon
    content = content.replace(
      /<Calendar className="([^"]+)" \/> [0-9]{2}\/[0-9]{2}\/[0-9]{4} - [0-9]{2}\/[0-9]{2}\/[0-9]{4}/g,
      '<Calendar className="$1" /> {selectedDateRange}'
    );

    // 3. Replace the active check "item === 'Last 7 Days'"
    content = content.replace(
      /item === "Last 7 Days" \? "bg-\[#F59E0B\]/g,
      'item === selectedDateRange ? "bg-[#F59E0B]'
    );

    // 4. Add onClick to the map items
    content = content.replace(
      /<button key=\{item\} className=\{`/g,
      '<button key={item} onClick={() => { setSelectedDateRange(item); setIsDateRangeOpen(false); }} className={`'
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
