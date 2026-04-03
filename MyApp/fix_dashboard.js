const fs = require('fs');
const glob = require('glob');

// Let's create a robust AST-based or highly specific regex logic to fix styles across all files.
// But first, let's fix TeacherDashboard manually.
const path = 'src/screens/teacher/TeacherDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Header style
content = content.replace(
  /header: \{[^}]*backgroundColor:\s*'#4F46E5'\s*\}/,
  `header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  }`
);

// headerTitle style
content = content.replace(
  /headerTitle:\s*\{[^}]*color:\s*'#FFFFFF'[^}]*\}/,
  `headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 }`
);

// statCardHalfAligned style
content = content.replace(
  /statCardHalfAligned:\s*\{[\s\S]*?minWidth:\s*100,\s*maxWidth:\s*140,\s*\}/,
  `statCardHalfAligned: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderTopWidth: 4,
    borderTopColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    minWidth: 100,
    maxWidth: 140,
  }`
);

// scheduleCard style
content = content.replace(
  /scheduleCard:\s*\{[\s\S]*?height:\s*80,[\s\S]*?elevation:\s*6\s*\}/,
  `scheduleCard: { backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB', paddingRight: 10, height: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }`
);

// quickActionCard style
content = content.replace(
  /quickActionCard:\s*\{[\s\S]*?elevation:\s*6\s*\}/,
  `quickActionCard: { width: '22%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }`
);

// Fix TSX section markers
content = content.replace(
  /sectionTitle:\s*\{[^}]*letterSpacing:\s*-0\.5\s*\}/,
  `sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' }`
);
content = content.replace(/<Text style=\{\[styles\.sectionTitle,\s*\{\s*color:\s*'#[A-F0-9]+'\s*\}\]\}>/g, '<Text style={styles.sectionTitle}>');

fs.writeFileSync(path, content);
console.log("Teacher dashboard updated successfully.");
