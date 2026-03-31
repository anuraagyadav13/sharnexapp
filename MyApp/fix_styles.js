const fs = require('fs');
const path = require('path');

const directories = [
  'src/screens/teacher',
  'src/screens/principal'
];

const globalHeaderStyle = `  globalHeader: {
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
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
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
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },`;

// Helper to replace styles across files
function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      let originalContent = content;

      // 1. Swap old huge shadow with new soft premium soft shadow
      content = content.replace(/shadowColor:\s*'#1E293B',\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*10\s*\},\s*shadowOpacity:\s*0\.06,\s*shadowRadius:\s*20,\s*elevation:\s*6/g, 
         "shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4");

      // Replace older #F8FAFC border colors with #E5E7EB
      content = content.replace(/borderColor:\s*'#F8FAFC'/g, "borderColor: '#E5E7EB'");
      content = content.replace(/borderColor:\s*'rgba\(226,232,240,0\.6\)'/g, "borderColor: '#E5E7EB'");

      // Fix header JSX if it has old header layout
      content = content.replace(/<View style=\{styles\.header\}>/, '<View style={styles.globalHeader}>');
      content = content.replace(/<View style=\{styles\.globalHeader\}>([\s\S]*?)<\/View>/, (match) => {
          // Inside the global header, replace blue icons with dark gray, replace white text with blue text wrapper
          let newHeader = match.replace(/color="#FFFFFF"/g, 'color="#1F2937"');
          return newHeader;
      });

      // Fix specific full replacement for global headers
      let hasHeaderStyle = /header:\s*\{[\s\S]*?paddingBottom:\s*20,[\s\S]*?backgroundColor:\s*'#4F46E5'[\s\S]*?\}/.test(content);
      if (hasHeaderStyle) {
          content = content.replace(/header:\s*\{[\s\S]*?backgroundColor:\s*'#4F46E5'[^}]*\},\s*(?:menuHandle|headerTitle|headerRight|iconBtn|avatar|avatarText):[^\n]*\n+/g, '');
          // If we removed it, we must inject globalHeaderStyle
      } else {
          // Replace existing globalHeader block
          content = content.replace(/globalHeader:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
          content = content.replace(/menuHandle:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
          content = content.replace(/headerTitle:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
          content = content.replace(/headerRight:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
          content = content.replace(/avatar:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
          content = content.replace(/avatarText:\s*\{[\s\S]*?(?=([a-zA-Z0-9_]+:\s*\{|export|}$))/g, '');
      }

      // Inject the globalHeaderStyle where StyleSheet.create begins
      if (content !== originalContent) {
          content = content.replace(/StyleSheet\.create\(\{/, `StyleSheet.create({\n${globalHeaderStyle}`);
      }

      // Fix any iconBtn leftovers
      content = content.replace(/<TouchableOpacity style=\{styles\.iconBtn\}>\s*<Ionicons name="notifications-outline" size=\{22\} color="#111827" \/>\s*<\/TouchableOpacity>/g, '<Ionicons name="notifications-outline" size={22} color="#1F2937" />');
      
      // Avatar click wrap
      content = content.replace(/<TouchableOpacity[^>]*>\s*<View style=\{\[styles\.avatar, \{ marginLeft: 10 \}\]\}>\s*<Text style=\{styles\.avatarText\}>[^<]+<\/Text>\s*<\/View>\s*<\/TouchableOpacity>/g, '<View style={styles.avatar}><Text style={styles.avatarText}>T</Text></View>');

      // Fix sectionTitle to dark color not black
      content = content.replace(/sectionTitle:\s*\{\s*fontSize:\s*\d+,\s*fontWeight:\s*'800',\s*letterSpacing:\s*-0.5\s*\}/g, "sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' }");

      if (content !== originalContent) {
         fs.writeFileSync(filePath, content, 'utf8');
         console.log(`Updated Styles in: ${filePath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
console.log('Script execution completed.');
