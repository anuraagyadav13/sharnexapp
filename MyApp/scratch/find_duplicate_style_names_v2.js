import fs from 'fs';
import path from 'path';

function findDuplicateStyleNames(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);/);
    if (!match) return;

    const stylesBlock = match[1];
    // Top-level keys usually have exactly 2 spaces (or 1 tab) indentation
    const styleNameMatches = stylesBlock.matchAll(/^ {2}([a-zA-Z0-9_]+):/gm);
    const names = [];
    for (const m of styleNameMatches) {
        const name = m[1];
        if (names.includes(name)) {
            console.log(`REAL DUPLICATE STYLE NAME: '${name}' in ${filePath}`);
        }
        names.push(name);
    }
}

const files = [
    'src/screens/teacher/TeacherDashboard.tsx',
    'src/screens/teacher/TeacherAttendanceScreen.tsx',
    'src/screens/teacher/TeacherQuizScreen.tsx',
    'src/screens/principal/PrincipalAddStudentScreen.tsx',
    'src/screens/auth/HomeScreen.tsx',
    'src/screens/principal/PrincipalRSMscreen.tsx'
];

files.forEach(f => {
    const fullPath = path.join('e:/Krushna/sharnexapp/MyApp', f);
    if (fs.existsSync(fullPath)) findDuplicateStyleNames(fullPath);
});
