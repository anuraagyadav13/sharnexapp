import React, { useState } from 'react';
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
import { RootStackParamList } from '../../types/navigation';

type PrincipalCreateExamNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalCreateExamScreen'
>;

interface Props {
  navigation: PrincipalCreateExamNavigationProp;
}

const PrincipalCreateExamScreen: React.FC<Props> = ({ navigation }) => {
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('MIDTERM');
  const [academicYear, setAcademicYear] = useState('2026');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Save as Draft');
  const [selectedClass, setSelectedClass] = useState('-- Select Class --');
  const [selectedSubject, setSelectedSubject] = useState('Choose Subject');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passMarks, setPassMarks] = useState('33');

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(280)} style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbMain}>RESULT MANAGEMENT</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbSub}>Create Exam</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(320).delay(60)} style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>Create New Exam</Text>
            <Text style={styles.pageSubtitle}>
              Define the academic scope and rules for this examination.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(120)} style={styles.card}>
          <Text style={styles.cardTitle}>General Information</Text>

          <View style={styles.divider} />

          <View style={styles.formGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EXAM NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Annual Examination 2024"
                placeholderTextColor="#9CA3AF"
                value={examName}
                onChangeText={setExamName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EXAM TYPE *</Text>
              <TouchableOpacity style={styles.selectBox} activeOpacity={0.85}>
                <Text style={styles.selectValue}>{examType}</Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ACADEMIC YEAR *</Text>
              <TextInput
                style={styles.input}
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="2026"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional notes or context"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={[styles.inputGroup, styles.fullWidth]}>
              <Text style={styles.label}>INITIAL STATUS *</Text>
              <TouchableOpacity style={styles.selectBox} activeOpacity={0.85}>
                <Text style={styles.selectValue}>{status}</Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Draft exams are hidden from teachers. Active exams are open for marks entry.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(380).delay(180)} style={styles.mappingHeader}>
          <Text style={styles.mappingTitle}>Academic Mapping</Text>
          <TouchableOpacity style={styles.mappingAddButton} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#A855F7" />
            <Text style={styles.mappingAddText}>Add Participating Class</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(420).delay(230)} style={styles.card}>
          <View style={styles.participationRow}>
            <View style={styles.mappingIconBox}>
              <Ionicons name="school-outline" size={18} color="#A855F7" />
            </View>

            <View style={styles.participationFieldWrap}>
              <Text style={styles.label}>PARTICIPATING CLASS</Text>
              <TouchableOpacity style={styles.selectBox} activeOpacity={0.85}>
                <Text style={styles.selectValue}>{selectedClass}</Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.trashButton} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.innerDivider} />

          <View style={styles.subjectRow}>
            <View style={[styles.inputGroup, styles.subjectField]}>
              <Text style={styles.label}>SUBJECT</Text>
              <TouchableOpacity style={styles.selectBox} activeOpacity={0.85}>
                <Text style={styles.selectValue}>{selectedSubject}</Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.marksField]}>
              <Text style={styles.label}>MAX MARKS</Text>
              <TextInput
                style={styles.input}
                value={maxMarks}
                onChangeText={setMaxMarks}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.marksField]}>
              <Text style={styles.label}>PASS MARKS</Text>
              <TextInput
                style={styles.input}
                value={passMarks}
                onChangeText={setPassMarks}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.subjectTrashButton} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addSubjectButton} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#A855F7" />
            <Text style={styles.addSubjectText}>Add Subject to Class</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(460).delay(280)} style={styles.footerActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} activeOpacity={0.9}>
            <Text style={styles.submitButtonText}>Create Exam Definition</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 40 },

  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  breadcrumbMain: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 2,
  },
  breadcrumbSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },

  formGrid: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    fontWeight: '500',
  },

  mappingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mappingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  mappingAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mappingAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A855F7',
    marginLeft: 6,
  },

  participationRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mappingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 20,
  },
  participationFieldWrap: {
    flex: 1,
  },
  trashButton: {
    paddingLeft: 12,
    paddingTop: 24,
  },

  subjectRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  subjectField: {
    width: '100%',
  },
  marksField: {
    width: '48%',
  },
  subjectTrashButton: {
    alignSelf: 'flex-end',
    marginTop: -6,
    paddingVertical: 8,
  },

  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  addSubjectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A855F7',
    marginLeft: 6,
  },

  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
});

export default PrincipalCreateExamScreen;
