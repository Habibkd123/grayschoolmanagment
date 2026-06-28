const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    let updatedCount = 0;
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updatedCount += processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Grid Replacements
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-2\b/g, 'grid-cols-1 md:grid-cols-2');
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-3\b/g, 'grid-cols-1 md:grid-cols-3');
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-4\b/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-5\b/g, 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5');
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-6\b/g, 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6');
            
            // Fixed Width Replacements (e.g., w-[250px] -> w-full sm:w-[250px])
            // Lookbehind to make sure we aren't prefixing something already prefixed.
            content = content.replace(/(?<!(?:sm|md|lg|xl|2xl):)\bw-\[(\d+(?:px|rem|em|%))\]/g, 'w-full sm:w-[$1]');
            
            // Fix flex on elements with md:flex-row to make sure they default to flex-col on mobile
            // Or fix flex container layout if explicitly mentioned. But maybe too risky.
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
                updatedCount++;
            }
        }
    }
    return updatedCount;
}

const dirToProcess = path.join(__dirname, 'app');
console.log('Starting responsive class update...');
const total = processDir(dirToProcess);
console.log(`\nFinished! Updated ${total} files.`);
