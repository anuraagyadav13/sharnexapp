const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/screens/teacher'),
  path.join(__dirname, 'src/screens/principal')
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Insert a comma if the character before the whitespace/newline preceding `shadowColor:` is a word char or quotation mark
  content = content.replace(/([A-Za-z0-9'\"])\s*\n\s*shadowColor:\s*'#4F46E5'/g, "$1,\n    shadowColor: '#4F46E5'");

  // There might be another syntax error if borderBottomLeftRadius: 16 was inserted after something not ending in comma
  // Example: backgroundColor: '#4F46E5' borderBottomLeftRadius: 16,
  content = content.replace(/([A-Za-z0-9'\"])\s*\n*\s*borderBottomLeftRadius:\s*\d+,/g, "$1,\n    borderBottomLeftRadius: 16,");

  // Same for borderRadius: 16 inserted for cards
  // Example: elevation: 6 borderRadius: 16
  content = content.replace(/([A-Za-z0-9'\"])\s*\n*\s*borderRadius:\s*16,\s*\n*\s*borderWidth:\s*1,/g, "$1,\n    borderRadius: 16,\n    borderWidth: 1,");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Fixed: " + filePath);
  }
}

function walk(dir) {
  let list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(file);
    }
  }
}

dirs.forEach(walk);
console.log("Done fixing syntax.");
