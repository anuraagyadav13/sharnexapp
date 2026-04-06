import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAttendance'>;

const TeacherAttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherId = authState.user?.id;
        if (!teacherId) return;

        const res = await apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
        setClasses(res.data.classes || []);
      } catch (error) {
        console.error('Failed to fetch teacher classes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Title Wrapper */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Attendance Portal</Text>
          <Text style={styles.pageSubtitle}>Monday, December 15, 2025</Text>
        </Animated.View>

        {/* Big White Main Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="checkbox" size={20} color="#111827" />
            <Text style={styles.cardHeaderTitle}>Today's Attendance</Text>
          </View>

          {/* List of Classes */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
          ) : classes.length === 0 ? (
            <Text style={styles.emptyText}>No classes assigned to you.</Text>
          ) : (
            classes.map((item, index) => {
              const isMarked = item.todayStatus === 'marked';
              return (
                <Animated.View key={item.id} entering={FadeInUp.delay(150 + index * 100).springify()} style={styles.classCard}>
  
                  {/* Class Info Top Area */}
                  <View style={styles.classInfoContainer}>
                    <View>
                      <Text style={styles.classNameText}>{item.name} - {item.section}</Text>
                      <View style={styles.classMetaRow}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="people" size={13} color="#4F46E5" style={{ marginRight: 6 }} />
                          <Text style={styles.metaText}>{item.totalStudents || 0} Students</Text>
                        </View>
                        <View style={[styles.metaBadge, { marginLeft: 20 }]}>
                          <Ionicons name="book" size={13} color="#3B82F6" style={{ marginRight: 6 }} />
                          <Text style={styles.metaText}>{item.grade || 'General'}</Text>
                        </View>
                      </View>
                    </View>
    
                    {isMarked && (
                      <View style={styles.markedPill}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.markedPillText}>Marked</Text>
                      </View>
                    )}
                  </View>
    
                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    {/* View Details Row */}
                    <TouchableOpacity style={styles.actionBtnWhite} activeOpacity={0.7} onPress={() => navigation.navigate('TeacherViewAttendance', { classId: item.id })}>
                      <View style={styles.actionBtnLeft}>
                        <View style={styles.checkboxOutline}>
                          <Ionicons name="checkmark" size={12} color="#9CA3AF" />
                        </View>
                        <Text style={styles.actionBtnText}>View Attendance Details</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                    </TouchableOpacity>
    
                    {/* Mark/Edit Row */}
                    <TouchableOpacity style={styles.actionBtnPurple} activeOpacity={0.7} onPress={() => navigation.navigate('TeacherMarkAttendance', { classId: item.id, className: item.name })}>
                      <View style={styles.actionBtnLeft}>
                        <View style={styles.checkboxFilled}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionBtnText}>Mark/Edit Attendance</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
    
                </Animated.View>
              );
            })
          )}
        </Animated.View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
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
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 20, paddingHorizontal: 16, marginTop: 24 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#4F46E5', marginBottom: 6 },
  pageSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  classCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  classInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  classNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  markedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  markedPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  actionsContainer: {
    gap: 12,
  },
  actionBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  actionBtnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default TeacherAttendanceScreen;
