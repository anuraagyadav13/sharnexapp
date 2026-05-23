import fs from 'fs';
import path from 'path';

function findDuplicates(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let inStyle = false;
    let currentObject = null;
    let objectStack = [];

    lines.forEach((line, index) => {
        // This is a very crude parser
        const match = line.match(/^\s*([a-zA-Z0-9_]+):/);
        if (match) {
            const key = match[1];
            // Check if key exists in current object scope
            // For now, let's just check for duplicate style names in StyleSheet.create
        }
    });
    
    // Better way: use regex to find all matches of "key:" and check if they repeat in a block
    const stylesBlockMatch = content.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);/);
    if (stylesBlockMatch) {
        const stylesContent = stylesBlockMatch[1];
        const styleMatches = stylesContent.matchAll(/^\s+([a-zA-Z0-9_]+): \{/gm);
        const styleNames = [];
        for (const m of styleMatches) {
            if (styleNames.includes(m[1])) {
                console.log(`Duplicate style name: ${m[1]} in ${filePath}`);
            }
            styleNames.push(m[1]);
        }
    }
}

const files = [
    'src/screens/teacher/TeacherDashboard.tsx',
    'src/screens/teacher/TeacherAttendanceScreen.tsx',
    'src/screens/teacher/TeacherQuizScreen.tsx',
    'src/screens/principal/PrincipalAddStudentScreen.tsx'
];

files.forEach(f => findDuplicates(path.join('e:/Krushna/sharnexapp/MyApp', f)));
