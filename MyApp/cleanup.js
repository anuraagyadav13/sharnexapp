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

            // Using pure regex for exact pattern
            const badPattern1 = /zIndex:\s*10\s*\}\s*,\s*shadowOpacity:\s*0\.06,\s*shadowRadius:\s*20,\s*elevation:\s*6,\s*zIndex:\s*10,?\s*\}/g;
            const badPattern2 = /zIndex:\s*10\s*\}\s*,\s*paddingBottom:\s*20,\s*borderBottomLeftRadius:\s*16,\s*borderBottomRightRadius:\s*16,\s*shadowColor:\s*'#000',\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*4\s*\},\s*shadowOpacity:\s*0\.08,\s*shadowRadius:\s*10,\s*elevation:\s*4,\s*zIndex:\s*10,?\s*\}/g;

            content = content.replace(badPattern1, 'zIndex: 10\n  }');
            content = content.replace(badPattern2, 'zIndex: 10\n  }');

            const genericBad = /zIndex:\s*10\s*\}\s*,\s*([^}]*?)\s*\}/g;
            
            // Actually it's simpler:
            let lastContent;
            do {
                lastContent = content;
                // If there's a duplicate zIndex: 10 } , ... } which matches only styles properties we can safely remove the second block
                content = content.replace(/zIndex:\s*10\s*\}\s*,\s*(?:[a-zA-Z]+:\s*[^,{]*,?\s*)+\}/g, 'zIndex: 10\n  }');
            } while (content !== lastContent);


            if (content !== orig) {
                fs.writeFileSync(p, content, 'utf8');
                updatedFiles++;
                console.log('Cleaned up', p);
            }
        }
    }
});
console.log(`Cleaned up ${updatedFiles} files.`);
