const fs = require('fs');
const path = require('path');

const dirs = ['src/screens/teacher', 'src/screens/principal'];
let updatedFiles = 0;

const replaceHeaderStyle = (content) => {
    // We want to reliably replace `header: { ... }` or `globalHeader: { ... }` that currently use purple background with the pure white one.
    // Also, we need to update the title color inside the header to `#4F46E5`.
    
    // Convert blue header to white header
    let res = content;
    
    // 1. Swap blue headers to white, and add soft shadow
    res = res.replace(
        /(?:header|globalHeader):\s*\{([^}]*?)backgroundColor:\s*'#4F46E5'([^}]*?)(?:elevation:\s*\d+,?)?\s*\}/g,
        "globalHeader: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    paddingHorizontal: 20,\n    paddingTop: Platform.OS === 'ios' ? 60 : 40,\n    paddingBottom: 16,\n    backgroundColor: '#FFFFFF',\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 6 },\n    shadowOpacity: 0.08,\n    shadowRadius: 10,\n    elevation: 8,\n    zIndex: 10\n  }"
    );

    // 2. The title should be #4F46E5
    res = res.replace(
        /(headerTitle|globalHeaderTitle):\s*\{([^}]*?)color:\s*'(?:#FFFFFF|#FFF)'([^}]*?)\}/g,
        "$1: {$2color: '#4F46E5'$3}"
    );

    // 3. Icons should be dark #1F2937, not #FFFFFF
    res = res.replace(/<Ionicons name="([^"]+)" size=\{22\} color="#(?:FFFFFF|FFF)"/g, '<Ionicons name="$1" size={22} color="#1F2937"');
    res = res.replace(/<Ionicons name="menu" size=\{28\} color="#(?:FFFFFF|FFF)"/g, '<Ionicons name="menu" size={28} color="#1F2937"');
    
    // Add safe margin to avatar box
    res = res.replace(
        /avatar:\s*\{([^}]*?)backgroundColor:\s*'#10B981'([^}]*?)\}/g,
        "avatar: {$1backgroundColor: '#A855F7'$2}" // Make avatar purple to match student
    );
    
    // Ensure avatar text says 'T' or 'P' depending on role but keeping it white. (Ignore role letter update for now)

    // Replace huge shadows globally!
    res = res.replace(/shadowColor:\s*'#1E293B'(?:(?:.|\n)*?)shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*\d+\s*\}(?:(?:.|\n)*?)shadowOpacity:\s*0\.06(?:(?:.|\n)*?)shadowRadius:\s*20(?:(?:.|\n)*?)elevation:\s*6/g, 
         "shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4");

    // Replace other specific card shadows
    res = res.replace(/shadowColor:\s*'#1E293B'(?:(?:.|\n)*?)shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*\d+\s*\}(?:(?:.|\n)*?)shadowOpacity:\s*0\.05(?:(?:.|\n)*?)shadowRadius:\s*16(?:(?:.|\n)*?)elevation:\s*5/g, 
         "shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4");

    // Change basic border colors from '#F8FAFC' (very invisible) or heavy to '#E5E7EB'
    res = res.replace(/borderColor:\s*'rgba\(226,232,240,0\.6\)'/g, "borderColor: '#E5E7EB'");
    res = res.replace(/borderColor:\s*'rgba\(226, 232, 240, 0\.6\)'/g, "borderColor: '#E5E7EB'");

    // Specifically for JSX
    res = res.replace(/style=\{styles\.header\}/g, "style={styles.globalHeader}");

    return res;
};

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.tsx')) {
            const p = path.join(dir, file);
            let content = fs.readFileSync(p, 'utf8');
            let orig = content;
            
            content = replaceHeaderStyle(content);
            if (content !== orig) {
                fs.writeFileSync(p, content, 'utf8');
                updatedFiles++;
                console.log('Fixed', p);
            }
        }
    }
});
console.log(`Updated ${updatedFiles} files.`);
