const fs = require('fs');

const fileList = [
    'src/screens/principal/PrincipalAddStudentScreen.tsx',
    'src/screens/teacher/TeacherAddQuestionScreen.tsx',
    'src/screens/teacher/TeacherAttendanceScreen.tsx',
    'src/screens/teacher/TeacherCreateAssignmentScreen.tsx',
    'src/screens/teacher/TeacherCreateQuizScreen.tsx',
    'src/screens/teacher/TeacherCreateQuizStep3Screen.tsx',
    'src/screens/teacher/TeacherDashboard.tsx',
    'src/screens/teacher/TeacherMarkAttendanceScreen.tsx',
    'src/screens/teacher/TeacherMonitorLiveScreen.tsx',
    'src/screens/teacher/TeacherQuizScreen.tsx',
    'src/screens/teacher/TeacherViewAttendanceScreen.tsx',
    'src/screens/teacher/TeacherViewQuizResultScreen.tsx',
    'src/screens/teacher/TeacherViewSubmissionScreen.tsx'
];

fileList.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    
    // Some lines might literally be:
    //     borderWidth: 1,
    //     borderColor: '#E5E7EB',
    // right below an existing `borderWidth` or above it.
    
    // Let's just find duplicates:
    // Typical issue caused by my script adding `borderWidth: 1, borderColor: '#F1F5F9'` or similar.
    content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'#F1F5F9',\s*borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)'/g, "borderWidth: 1, borderColor: '#E5E7EB'");
    content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)',\s*borderWidth:\s*1/g, "borderWidth: 1, borderColor: '#E5E7EB'");
    
    content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)'\s*,\s*borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)'/g, "borderWidth: 1, borderColor: '#E5E7EB'");
    content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)'\s*,[\s\r\n]*borderWidth:\s*1,\s*borderColor:\s*'#(?:E5E7EB|F8FAFC)'/g, "borderWidth: 1, borderColor: '#E5E7EB'");
    content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'#E5E7EB'\s*,[\s\r\n]*borderWidth:\s*1,\s*borderColor:\s*'#E5E7EB'/g, "borderWidth: 1, borderColor: '#E5E7EB'");

    // For generic duplicates of borderWidth: 1, borderColor: ...
    content = content.replace(/(borderWidth:\s*1,\s*borderColor:\s*'#[^']+',?\s*)\1/g, "$1");

    content = content.replace(/([\s\S])borderWidth:\s*1,\s*borderColor:\s*'#E5E7EB'(?:[\s\S]*?)borderWidth:\s*1,\s*borderColor:\s*'#E5E7EB'/g, (m) => {
       // if they are inside the same block
       const match = m.replace(/borderWidth:\s*1,\s*borderColor:\s*'#E5E7EB'/, '');
       return match;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed dedup in', file);
    }
});
