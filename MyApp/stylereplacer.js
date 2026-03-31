const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/screens/teacher'),
  path.join(__dirname, 'src/screens/principal')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. CARDS SHADOWS
  content = content.replace(/shadowColor:\s*['"][^'"]+['"]/g, "shadowColor: '#1E293B'");
  content = content.replace(/shadowOffset:\s*\{\s*width:\s*-?\d+,\s*height:\s*-?\d+\s*\}/g, "shadowOffset: { width: 0, height: 10 }");
  content = content.replace(/shadowOpacity:\s*[\d.]+/g, "shadowOpacity: 0.06");
  content = content.replace(/shadowRadius:\s*[\d.]+/g, "shadowRadius: 20");
  content = content.replace(/elevation:\s*\d+/g, "elevation: 6");
  
  // 1. CARDS BORDER AND PADDING
  // We look for patterns like card, Card, box, Box
  content = content.replace(/([a-zA-Z0-9]+[Cc]ard|[a-zA-Z0-9]+[Bb]ox|listContainer|summaryCard|classCard|assignmentCard|quickActionCard)["']?\s*:\s*\{([^}]+)\}/g, (match, name, inner) => {
    let replaced = inner;
    // apply radius 16 and padding 24
    if (/backgroundColor:\s*['"]#FFFFFF['"]/i.test(inner) || /backgroundColor:\s*['"]#FFF['"]/i.test(inner) || /elevation:\s*6/i.test(inner)) {
       replaced = replaced.replace(/borderRadius:\s*\d+/g, "borderRadius: 16");
       replaced = replaced.replace(/padding:\s*\d+/g, "padding: 24");
       if (!/borderColor/.test(replaced) && !/borderWidth/.test(replaced)) {
           replaced = replaced.replace(/borderRadius:\s*16,/, "borderRadius: 16,\n    borderWidth: 1,\n    borderColor: 'rgba(226,232,240,0.6)',");
       }
    }
    return `${name}: {${replaced}}`;
  });

  // 2. SPACING
  // "Screen horizontal padding: 16", "Top spacing: 24", "Card gap: 20"
  content = content.replace(/paddingHorizontal:\s*20/g, "paddingHorizontal: 16");
  content = content.replace(/marginTop:\s*16/g, "marginTop: 24");
  content = content.replace(/marginBottom:\s*16/g, "marginBottom: 20");
  content = content.replace(/gap:\s*16/g, "gap: 20");
  content = content.replace(/gap:\s*14/g, "gap: 20");

  // 3. COLORS
  content = content.replace(/#4C66CB|#3258ED|#6A67FE|#5A67D8|#6366F1/gi, "#4F46E5");
  content = content.replace(/#FAF9F9|#F9FAFB/gi, "#F8FAFC");
  
  // 5. BUTTONS
  content = content.replace(/([a-zA-Z0-9]+[Bb]tn[a-zA-Z0-9]*|[a-zA-Z0-9]+[Bb]utton[a-zA-Z0-9]*)["']?\s*:\s*\{([^}]+)\}/g, (match, name, inner) => {
    let replaced = inner;
    replaced = replaced.replace(/borderRadius:\s*\d+/g, "borderRadius: 8");
    replaced = replaced.replace(/paddingVertical:\s*\d+/g, "paddingVertical: 14");
    if (!/paddingHorizontal/.test(replaced) && /paddingVertical/.test(replaced)) {
       replaced = replaced.replace(/paddingVertical:\s*14,/, "paddingVertical: 14,\n    paddingHorizontal: 20,");
    }
    // primary button shadow
    if (/backgroundColor:\s*['"]#4F46E5['"]/.test(replaced)) {
       if (!/shadowColor/.test(replaced)) {
          replaced += "\n    shadowColor: '#4F46E5',\n    shadowOffset: { width: 0, height: 4 },\n    shadowOpacity: 0.3,\n    shadowRadius: 8,\n    elevation: 4,";
       }
    }
    return `${name}: {${replaced}}`;
  });

  // 6. HERO HEADER
  content = content.replace(/(globalHeader|heroBanner|header)["']?\s*:\s*\{([^}]+)\}/g, (match, name, inner) => {
      let newInner = inner.replace(/backgroundColor:\s*['"][^'"]+['"]/gi, "backgroundColor: '#4F46E5'");
      if (!/borderBottomLeftRadius/.test(newInner)) {
         newInner = newInner.replace(/paddingBottom:\s*\d+,/, "paddingBottom: 20,\n    borderBottomLeftRadius: 16,\n    borderBottomRightRadius: 16,");
      }
      return `${name}: {${newInner}}`;
  });

  content = content.replace(/headerTitle:\s*\{\s*([^}]+)\}/g, (match, inner) => {
      let newInner = inner.replace(/color:\s*['"][^'"]+['"]/gi, "color: '#FFFFFF'");
      return `headerTitle: { ${newInner}}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Updated: " + filePath);
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
      processFile(file);
    }
  }
}

dirs.forEach(walk);
console.log("Done.");
