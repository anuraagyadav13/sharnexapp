const fs = require('fs');

const file = 'src/screens/teacher/TeacherDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header fixes
content = content.replace(
  /header:\s*\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center',\s*justifyContent:\s*'space-between',\s*paddingHorizontal:\s*16,\s*paddingTop:\s*Platform\.OS\s*===\s*'ios'\s*\?\s*60\s*:\s*30,\s*paddingBottom:\s*20,\s*borderBottomLeftRadius:\s*16,\s*borderBottomRightRadius:\s*16,\s*backgroundColor:\s*'#4F46E5'\s*\}/,
  `globalHeader: {
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

// Menu Handle
content = content.replace(
  /menuHandle:\s*\{\s*paddingRight:\s*10,\s*paddingVertical:\s*10\s*\}/,
  `menuHandle: { paddingRight: 10, paddingVertical: 10 }`
);

// Header title
content = content.replace(
  /headerTitle:\s*\{\s*fontSize:\s*16,\s*fontWeight:\s*'500',\s*color:\s*'#FFFFFF',\s*flex:\s*1,\s*textAlign:\s*'center',\s*marginHorizontal:\s*10\s*\}/,
  `headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  }`
);

// Header right
content = content.replace(
  /headerRight:\s*\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center',\s*gap:\s*6\s*\}/,
  `headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 }`
);

// Avatar
content = content.replace(
  /avatar:\s*\{\s*width:\s*34,\s*height:\s*34,\s*borderRadius:\s*17,\s*backgroundColor:\s*'#10B981',\s*justifyContent:\s*'center',\s*alignItems:\s*'center',\s*shadowColor:\s*'#1E293B',\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*10\s*\},\s*shadowOpacity:\s*0\.06,\s*shadowRadius:\s*20,\s*elevation:\s*6\s*\}/,
  `avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  }`
);

// JSX Fixes
content = content.replace(/style=\{styles\.header\}/g, 'style={styles.globalHeader}');
content = content.replace(
  /<TouchableOpacity style=\{styles\.iconBtn\}>\s*<Ionicons name="notifications-outline" size=\{22\} color="#111827" \/>\s*<\/TouchableOpacity>\s*<TouchableOpacity\s*activeOpacity=\{0\.8\}\s*>\s*<View style=\{\[styles\.avatar, \{ marginLeft: 10 \}\]\}>\s*<Text style=\{styles\.avatarText\}>T<\/Text>\s*<\/View>\s*<\/TouchableOpacity>/,
  `<Ionicons name="notifications-outline" size={22} color="#1F2937" />
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
            <Ionicons name="moon-outline" size={22} color="#1F2937" />
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>T</Text>
            </View>`
);

// Also remove `iconBtn` style
content = content.replace(/iconBtn: \{[^}]+\},/g, '');

// Card styling updates
content = content.replace(/shadowColor:\s*'#1E293B',\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*10\s*\},\s*shadowOpacity:\s*0\.06,\s*shadowRadius:\s*20,\s*elevation:\s*6/g, "shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4");

content = content.replace(/borderColor:\s*'#F8FAFC'/g, "borderColor: '#E5E7EB'");
content = content.replace(/borderWidth:\s*1,\s*borderColor:\s*'rgba\(226,232,240,0\.6\)'/g, "borderWidth: 1, borderColor: '#E5E7EB'");

// Fix section title
content = content.replace(
  /sectionTitle:\s*\{\s*fontSize:\s*20,\s*fontWeight:\s*'800',\s*letterSpacing:\s*-0\.5\s*\}/,
  "sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' }"
);

content = content.replace(/<Text style=\{\[\s*styles\.sectionTitle,\s*\{\s*color:\s*'#[^']+'\s*\}\s*\]\}>/g, "<Text style={styles.sectionTitle}>");

fs.writeFileSync(file, content);
console.log('Fixed Teacher Dashboard');
