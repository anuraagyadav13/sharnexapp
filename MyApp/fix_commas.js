const fs = require('fs');
const path = require('path');

const dirs = ['src/screens/teacher', 'src/screens/principal'];
let updatedFiles = 0;

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.tsx')) {
            const p = path.join(dir, file);
            let content = fs.readFileSync(p, 'utf8');
            let orig = content;
            
            // Fix double commas
            content = content.replace(/,\s*,/g, ',');
            
            // Fix leading commas in objects  `{ ,`
            content = content.replace(/\{\s*,/g, '{');
            
            // Fix trailing commas before closing braces (this is allowed in JS but sometimes causes issues, actually it doesn't cause TS errors, but let's leave it alone or clean it).
            // Actually TS allows trailing commas.
            
            // Check for any cases where we left whitespace and commas
            content = content.replace(/,\s*,\s*,/g, ',');
            content = content.replace(/\{\s*,\s*,/g, '{');

            // Wait, my dedup left: `borderRadius: 16, , padding: 24`
            // `,\s*,` catches that and becomes `,`.
            
            if (content !== orig) {
                fs.writeFileSync(p, content, 'utf8');
                updatedFiles++;
                console.log('Fixed commas in', p);
            }
        }
    }
});
console.log(`Cleaned up ${updatedFiles} files.`);
