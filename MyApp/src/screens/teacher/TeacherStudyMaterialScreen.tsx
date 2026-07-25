import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  FlatList,
  RefreshControl,
  Linking
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import teacherService from '../../services/teacherService';

const { width } = Dimensions.get('window');

// Dynamic module loading for DocumentPicker (following project pattern)
let DocumentPicker: any = null;
let DocumentPickerTypes: any = null;

const TeacherStudyMaterialScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Material');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal State
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['All Material', 'PDFs', 'Videos', 'Documents', 'Notes'];

  useEffect(() => {
    fetchInitialData(false);
  }, [authState.user?.id]);

  const fetchInitialData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const teacherId = authState.user?.id;
      if (!teacherId) return;

      const [materialsRes, classesRes] = await Promise.all([
        teacherService.getStudyMaterials(),
        teacherService.getClasses(teacherId)
      ]);

      const materialList = materialsRes.data?.materials || [];
      const classList = classesRes.data || classesRes.data?.classes || [];
      
      setMaterials(materialList);
      setClasses(classList);
      if (classList.length > 0) setNewClassId(classList[0].id);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [authState.user?.id]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchInitialData(true);
    setIsRefreshing(false);
  }, [fetchInitialData]);

  const ensureDocumentPicker = () => {
    if (DocumentPicker && DocumentPickerTypes) return;
    try {
      // @ts-ignore
      const module = require('react-native-document-picker-v2');
      DocumentPicker = module.default || module;
      DocumentPickerTypes = module.types || module.Types || DocumentPicker?.types || DocumentPicker?.Types || module;
    } catch (e) {
      console.error('DocumentPicker failed to load:', e);
    }
  };

  const handlePickFile = async () => {
    try {
      ensureDocumentPicker();
      if (!DocumentPicker || !DocumentPickerTypes) {
        Alert.alert('Error', 'File picker is not available on this device.');
        return;
      }

      const result = await DocumentPicker.pick({
        type: [DocumentPickerTypes.allFiles],
      });

      const file = Array.isArray(result) ? result[0] : result;
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.type,
        size: file.size
      });
    } catch (err) {
      if (!DocumentPicker?.isCancel?.(err)) {
        console.error('Document picking error:', err);
      }
    }
  };

  const handleUpload = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title.');
      return;
    }
    if (!newClassId) {
      Alert.alert('Validation Error', 'Please select a target class.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Validation Error', 'Please choose a file to upload.');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('title', newTitle.trim());
      formData.append('description', newDescription.trim());
      formData.append('classId', newClassId);
      formData.append('subject', newSubject.trim());
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type || 'application/octet-stream'
      } as any);

      await teacherService.uploadStudyMaterial(formData);

      Alert.alert('Success', 'Study material uploaded successfully!');
      setUploadModalVisible(false);
      resetModalState();
      fetchInitialData();
    } catch (err: any) {
      console.error('Upload failed:', err);
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModalState = () => {
    setNewTitle('');
    setNewDescription('');
    setNewSubject('');
    setSelectedFile(null);
  };

  const handleDeleteMaterial = (id: string) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this study material? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await teacherService.deleteStudyMaterial(id);
              fetchInitialData();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete material.');
            }
          }
        }
      ]
    );
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const materialType = m.file_type?.toLowerCase();
    
    if (selectedCategory === 'PDFs') return matchesSearch && materialType === 'pdf';
    if (selectedCategory === 'Videos') return matchesSearch && materialType === 'video';
    if (selectedCategory === 'Documents') return matchesSearch && materialType === 'document';
    if (selectedCategory === 'Notes') return matchesSearch && materialType === 'notes';
    
    return matchesSearch;
  });

  const MaterialItem = ({ item }: { item: any }) => (
    <Animated.View entering={FadeInUp.springify()} layout={Layout.springify()} style={styles.materialItem}>
      <View style={styles.materialIconContainer}>
        <MaterialCommunityIcons 
          name={item.file_type === 'pdf' ? 'file-pdf-box' : item.file_type === 'video' ? 'play-circle' : 'file-document'} 
          size={32} 
          color={item.file_type === 'pdf' ? '#EF4444' : item.file_type === 'video' ? '#3B82F6' : '#10B981'} 
        />
      </View>
      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.materialMeta}>{item.class_name} • {item.subject || 'General'}</Text>
        <Text style={styles.materialDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.materialActions}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteMaterial(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionIcon}
          onPress={() => {
            const url = item.file_url || item.fileUrl || item.url;
            if (url) {
              Linking.openURL(url).catch(err => {
                console.error("Failed to open study material URL:", err);
                Alert.alert("Error", "Failed to open study material file link.");
              });
            } else {
              Alert.alert("Unavailable", "No file download URL is associated with this study material.");
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      
      {/* Attendance-Style Header */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>Study Material</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.uploadBtnHeader} 
            onPress={() => setUploadModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload" size={18} color="#FFF" />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content List */}
        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : filteredMaterials.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No materials found</Text>
            <Text style={styles.emptyStateSubtext}>Upload your first study resource to get started.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredMaterials}
            renderItem={({ item }) => <MaterialItem item={item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={isUploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload New Material</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Trigonometry Formulas"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any details about this material"
                multiline
                numberOfLines={3}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Class *</Text>
                  <View style={styles.pickerContainer}>
                    {/* Modern replacement for Picker could be a custom select or flatlist */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingVertical: 8}}>
                      {classes.map(c => (
                        <TouchableOpacity 
                          key={c.id} 
                          style={[styles.miniClassPill, newClassId === c.id && styles.miniClassPillActive]}
                          onPress={() => setNewClassId(c.id)}
                        >
                          <Text style={[styles.miniClassText, newClassId === c.id && styles.miniClassTextActive]}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Mathematics"
                    value={newSubject}
                    onChangeText={setNewSubject}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>File Upload *</Text>
              <TouchableOpacity style={styles.filePickerBox} onPress={handlePickFile}>
                {selectedFile ? (
                  <View style={styles.selectedFileView}>
                    <Ionicons name="document-attach" size={32} color="#4F46E5" />
                    <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Text style={styles.removeFile}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={40} color="#94A3B8" />
                    <Text style={styles.uploadText}>Click to browse files</Text>
                    <Text style={styles.uploadSubtext}>Support PDF, DOC, Video (Max 10MB)</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setUploadModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalUploadBtn, (isUploading || !newTitle || !selectedFile) && styles.disabledBtn]} 
                  onPress={handleUpload}
                  disabled={isUploading || !newTitle || !selectedFile}
                >
                  {isUploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalUploadText}>Upload Material</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="teacher" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  topHeaderTitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  uploadBtnHeader: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  searchSection: { padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: theme.text },

  categoryContainer: { marginBottom: 16 },
  categoryScroll: { paddingHorizontal: 16 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryPillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  categoryText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
  categoryTextActive: { color: '#FFF' },

  listContent: { padding: 16 },
  materialItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  materialMeta: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  materialDate: { fontSize: 10, color: theme.subtext, marginTop: 4 },
  materialActions: { flexDirection: 'row', gap: 12 },
  actionIcon: { padding: 4 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: theme.subtext, textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  modalForm: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', marginBottom: 8 },
  pickerContainer: { marginTop: 4 },
  miniClassPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  miniClassPillActive: { backgroundColor: theme.isDarkMode ? '#312E8140' : '#EEF2FF', borderColor: theme.primary },
  miniClassText: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  miniClassTextActive: { color: theme.primary, fontWeight: '700' },

  filePickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: theme.background,
    marginTop: 8,
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: theme.primary, marginTop: 12 },
  uploadSubtext: { fontSize: 11, color: theme.subtext, marginTop: 4 },
  selectedFileView: { alignItems: 'center', width: '100%' },
  fileName: { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 8 },
  removeFile: { color: '#EF4444', fontSize: 12, fontWeight: '700', marginTop: 8 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 40 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: theme.subtext },
  modalUploadBtn: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: theme.primary },
  modalUploadText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  disabledBtn: { opacity: 0.6 },
});

export default TeacherStudyMaterialScreen;
