import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Find all keys in this line (assuming one line per style)
        const keys = [];
        const matches = line.matchAll(/([a-zA-Z0-9_]+):/g);
        for (const m of matches) {
            keys.push(m[1]);
        }
        
        // This is still crude because it doesn't handle nesting well, 
        // but let's see if there are duplicates on the SAME line that are NOT 'width' or 'height' or 'shadowOffset' related
        const counts = {};
        keys.forEach(k => {
            if (['width', 'height', 'shadowOffset', 'shadowColor', 'shadowOpacity', 'shadowRadius', 'elevation'].includes(k)) return;
            counts[k] = (counts[k] || 0) + 1;
            if (counts[k] > 1) {
                console.log(`Duplicate key '${k}' on line ${index + 1} of ${filePath}`);
            }
        });
    });
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
    if (fs.existsSync(fullPath)) checkFile(fullPath);
});
