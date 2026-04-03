import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { RootStackParamList } from '../../types/navigation';

type PrincipalRSMNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalRSM'>;

interface Props {
  navigation: PrincipalRSMNavigationProp;
}

type ExamStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

interface ExamItem {
  id: string;
  name: string;
  type: string;
  year: string;
  scope: string;
  status: ExamStatus;
}

const EXAMS: ExamItem[] = [
  { id: '1', name: 'Unit Test', type: 'UNIT_TEST', year: '2026', scope: '1 Classes', status: 'ACTIVE' },
  { id: '2', name: 'Midterm', type: 'MIDTERM', year: '2026', scope: '1 Classes', status: 'ACTIVE' },
  { id: '3', name: 'Final Exam', type: 'FINAL', year: '2026', scope: '1 Classes', status: 'ACTIVE' },
];

const getStatusColors = (status: ExamStatus) => {
  switch (status) {
    case 'ACTIVE':
      return {
        bg: '#DCFCE7',
        text: '#15803D',
      };
    case 'DRAFT':
      return {
        bg: '#E0E7FF',
        text: '#4338CA',
      };
    case 'ARCHIVED':
      return {
        bg: '#F1F5F9',
        text: '#475569',
      };
    default:
      return {
        bg: '#F1F5F9',
        text: '#475569',
      };
  }
};


const PrincipalRSMscreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [exams, setExams] = useState(EXAMS);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredExams = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return exams;
    return exams.filter((exam) =>
      [exam.name, exam.type, exam.year].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [searchText, exams]);

  // Navigation handlers
  const handleView = (exam: ExamItem) => {
    navigation.navigate('PrincipalReviewExamScreen', { examId: exam.id });
  };
  const handleEdit = (exam: ExamItem) => {
    navigation.navigate('PrincipalCreateExamScreen', { examId: exam.id });
  };
  const handleDelete = (exam: ExamItem) => {
    setDeletingId(exam.id);
  };
  const confirmDelete = () => {
    setExams((prev) => prev.filter((e) => e.id !== deletingId));
    setDeletingId(null);
  };
  const cancelDelete = () => setDeletingId(null);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Result Management
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Result Management</Text>
          <Text style={styles.pageSubtitle}>
            Manage official exam definitions and their lifecycle.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350).delay(80)}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PrincipalCreateExamScreen')}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Exam</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120)} style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search exams by name, type, or year..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(180)} style={styles.listCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.examNameCol]}>EXAM NAME</Text>
            <Text style={[styles.tableHeaderText, styles.typeCol]}>TYPE</Text>
            <Text style={[styles.tableHeaderText, styles.yearCol]}>YEAR</Text>
          </View>

          {filteredExams.map((exam, index) => {
            const colors = getStatusColors(exam.status);
            return (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examRow,
                  index !== filteredExams.length - 1 && styles.examRowBorder,
                ]}
                activeOpacity={0.85}
                onPress={() => handleView(exam)}
              >
                <View style={styles.examTopRow}>
                  <View style={styles.examIdentityWrap}>
                    <View style={styles.examIconBox}>
                      <Ionicons name="document-text" size={18} color="#A855F7" />
                    </View>
                    <View style={styles.examIdentityTextWrap}>
                      <Text style={styles.examName}>{exam.name}</Text>
                      <Text style={styles.examTypeMobile}>{exam.type}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: colors.bg }]}> 
                    <Text style={[styles.statusText, { color: colors.text }]}>{exam.status}</Text>
                  </View>
                </View>

                <View style={styles.examMetaRow}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Type</Text>
                    <Text style={styles.metaValue}>{exam.type}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Academic Year</Text>
                    <Text style={styles.metaValue}>{exam.year}</Text>
                  </View>
                </View>

                <View style={styles.examMetaRow}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Scope</Text>
                    <View style={styles.scopePill}>
                      <Text style={styles.scopeText}>{exam.scope}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleView(exam);
                    }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#64748B" />
                    <Text style={styles.actionLabel}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(exam);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#64748B" />
                    <Text style={styles.actionLabel}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(exam);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#64748B" />
                    <Text style={styles.actionLabel}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredExams.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search-outline" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No exams found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching with another exam name, type, or academic year.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Delete confirmation modal */}
        {deletingId && (
          <View style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 300, alignItems: 'center', elevation: 8 }}>
              <Ionicons name="warning-outline" size={36} color="#F59E42" style={{ marginBottom: 12 }} />
              <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Delete Exam?</Text>
              <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 18 }}>
                Are you sure you want to delete this exam? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8, marginRight: 8 }}
                  onPress={cancelDelete}
                >
                  <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 }}
                  onPress={confirmDelete}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 8,
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A78BFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  addButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    minHeight: 38,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 12,
    minHeight: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  examNameCol: { flex: 1.4 },
  typeCol: { flex: 1 },
  yearCol: { flex: 0.7, textAlign: 'right' },

  examRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  examRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  examTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  examIdentityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examIdentityTextWrap: {
    flex: 1,
  },
  examName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  examTypeMobile: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  examMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  scopePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
    letterSpacing: 0.1,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default PrincipalRSMscreen;
