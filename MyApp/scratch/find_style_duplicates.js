import fs from 'fs';
import path from 'path';

function checkStyles(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);/);
    if (!match) return;

    const stylesBlock = match[1];
    // Split by top-level keys
    const styleBlocks = stylesBlock.split(/\n\s+([a-zA-Z0-9_]+): \{/);
    // The first element is before the first style
    for (let i = 1; i < styleBlocks.length; i += 2) {
        const styleName = styleBlocks[i];
        const styleContent = styleBlocks[i+1];
        
        // Find all keys in this style block
        const keys = [];
        const keyMatches = styleContent.matchAll(/^\s+([a-zA-Z0-9_]+):/gm);
        for (const km of keyMatches) {
            keys.push(km[1]);
        }
        
        const counts = {};
        keys.forEach(k => {
            counts[k] = (counts[k] || 0) + 1;
            if (counts[k] > 1) {
                console.log(`Duplicate property '${k}' in style '${styleName}' of ${filePath}`);
            }
        });
    }
}

const files = [
    'src/screens/teacher/TeacherDashboard.tsx',
    'src/screens/teacher/TeacherAttendanceScreen.tsx',
    'src/screens/teacher/TeacherQuizScreen.tsx',
    'src/screens/principal/PrincipalAddStudentScreen.tsx',
    'src/screens/auth/HomeScreen.tsx'
];

files.forEach(f => {
    const fullPath = path.join('e:/Krushna/sharnexapp/MyApp', f);
    if (fs.existsSync(fullPath)) checkStyles(fullPath);
});
