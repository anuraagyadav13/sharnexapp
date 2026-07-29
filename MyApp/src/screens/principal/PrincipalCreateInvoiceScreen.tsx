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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import principalService from '../../services/principalService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PrincipalCreateInvoice'>;

interface Props {
  navigation: Nav;
}

interface ClassOption {
  id: string;
  name: string;
  section?: string;
  grade?: string;
}

interface StudentOption {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
}

interface FeeItem {
  id: string;
  description: string;
  amount: string;
}

let feeItemCounter = 0;

const PrincipalCreateInvoiceScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme, isDarkMode);

  // Data
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Form
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([{ id: `fi-${++feeItemCounter}`, description: '', amount: '' }]);
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class selector open
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const res = await principalService.getClasses();
        const raw = res.data?.classes || res.data?.data || [];
        setClasses(Array.isArray(raw) ? raw : []);
      } catch {
        // ignore
      } finally {
        setIsLoadingClasses(false);
      }
    })();
  }, []);

  // Load students when class selected
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentIds([]);
      return;
    }
    (async () => {
      setIsLoadingStudents(true);
      try {
        const res = await principalService.getClassStudents(selectedClassId);
        const raw = res.data?.students || res.data?.data || [];
        setStudents(Array.isArray(raw) ? raw : []);
      } catch {
        setStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    })();
    setSelectedStudentIds([]);
  }, [selectedClassId]);

  const totalAmount = feeItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const addFeeItem = () => {
    setFeeItems(prev => [...prev, { id: `fi-${++feeItemCounter}`, description: '', amount: '' }]);
  };

  const removeFeeItem = (id: string) => {
    if (feeItems.length <= 1) return;
    setFeeItems(prev => prev.filter(i => i.id !== id));
  };

  const updateFeeItem = (id: string, field: 'description' | 'amount', value: string) => {
    setFeeItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const getClassName = (id: string) => {
    const c = classes.find(cl => cl.id === id);
    if (!c) return '';
    let name = c.name;
    if (c.section) name += ` ${c.section}`;
    if (c.grade) name += ` (Grade ${c.grade})`;
    return name;
  };

  const handleSubmit = async () => {
    // Validate
    if (!selectedClassId) return Alert.alert('Error', 'Please select a class.');
    if (selectedStudentIds.length === 0) return Alert.alert('Error', 'Select at least one student.');
    const validItems = feeItems.filter(i => i.description && parseFloat(i.amount) > 0);
    if (validItems.length === 0) return Alert.alert('Error', 'Add at least one fee item with a valid amount.');
    if (!dueDate) return Alert.alert('Error', 'Due date is required.');
    if (!month) return Alert.alert('Error', 'Please select a month.');

    let formattedDueDate = dueDate;
    const dmyMatch = dueDate.match(/^(\d{2})[-/]?(\d{2})[-/]?(\d{4})$/);
    const ymdMatch = dueDate.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})$/);
    if (dmyMatch) {
      formattedDueDate = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T00:00:00.000Z`;
    } else if (ymdMatch) {
      formattedDueDate = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}T00:00:00.000Z`;
    } else {
      return Alert.alert('Error', 'Please enter a valid Due Date (e.g., DD-MM-YYYY).');
    }

    setIsSubmitting(true);
    try {
      const description = validItems.map(i => i.description).join(', ');
      let successCount = 0;
      let failCount = 0;

      for (const studentId of selectedStudentIds) {
        try {
          await principalService.createInvoice({
            studentId,
            baseAmount: totalAmount,
            description,
            dueDate: formattedDueDate,
            month,
            academicYear: '2024-25',
            feeItems: validItems.map(i => ({ description: i.description, amount: parseFloat(i.amount) })),
          });
          successCount++;
        } catch (e: any) {
          console.error('Invoice creation failed for student', studentId, e?.response?.data || e);
          failCount++;
        }
      }

      if (failCount === 0) {
        Alert.alert('Success', `${successCount} invoice(s) created successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Partial Success', `${successCount} created, ${failCount} failed.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create invoices.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create New Invoice</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Class Selector */}
        <Text style={s.label}>Class <Text style={s.required}>*</Text></Text>
        <TouchableOpacity style={s.selectBox} onPress={() => setClassDropdownOpen(!classDropdownOpen)}>
          <View style={s.selectIconBox}>
            <Ionicons name="school" size={16} color="#7C3AED" />
          </View>
          <Text style={[s.selectText, !selectedClassId && { color: '#94A3B8' }]}>
            {selectedClassId ? getClassName(selectedClassId) : 'Select a class'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>
        {classDropdownOpen && (
          <View style={s.dropdown}>
            {isLoadingClasses ? (
              <ActivityIndicator size="small" color="#7C3AED" style={{ padding: 16 }} />
            ) : classes.length === 0 ? (
              <Text style={s.dropdownEmpty}>No classes found</Text>
            ) : (
              classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.dropdownItem, selectedClassId === c.id && s.dropdownItemActive]}
                  onPress={() => { setSelectedClassId(c.id); setClassDropdownOpen(false); }}
                >
                  <Text style={[s.dropdownText, selectedClassId === c.id && { color: '#7C3AED', fontWeight: '700' }]}>
                    {c.name}{c.section ? ` ${c.section}` : ''}{c.grade ? ` (Grade ${c.grade})` : ''}
                  </Text>
                  {selectedClassId === c.id && <Ionicons name="checkmark" size={16} color="#7C3AED" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Students */}
        <Text style={[s.label, { marginTop: 20 }]}>Students <Text style={s.required}>*</Text></Text>
        <View style={s.studentsBox}>
          {!selectedClassId ? (
            <View style={s.studentsPlaceholder}>
              <Ionicons name="people" size={24} color="#CBD5E1" />
              <Text style={s.studentsPlaceholderText}>Select a class first to view students</Text>
            </View>
          ) : isLoadingStudents ? (
            <ActivityIndicator size="small" color="#7C3AED" style={{ padding: 20 }} />
          ) : students.length === 0 ? (
            <Text style={s.studentsPlaceholderText}>No students found in this class</Text>
          ) : (
            <>
              <TouchableOpacity style={s.selectAllRow} onPress={selectAllStudents}>
                <View style={[s.checkbox, selectedStudentIds.length === students.length && s.checkboxChecked]}>
                  {selectedStudentIds.length === students.length && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={s.selectAllText}>
                  Select All ({selectedStudentIds.length}/{students.length})
                </Text>
              </TouchableOpacity>
              {students.map(stu => {
                const selected = selectedStudentIds.includes(stu.id);
                return (
                  <TouchableOpacity key={stu.id} style={s.studentItem} onPress={() => toggleStudent(stu.id)}>
                    <View style={[s.checkbox, selected && s.checkboxChecked]}>
                      {selected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                    <Text style={s.studentItemText}>{stu.name || `${stu.firstName} ${stu.lastName}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        {/* Fee Items */}
        <Text style={[s.label, { marginTop: 20 }]}>Fee Items <Text style={s.required}>*</Text></Text>
        <View style={s.feeItemsBox}>
          <View style={s.feeItemsHeader}>
            <Text style={s.feeColLabel}>DESCRIPTION</Text>
            <Text style={[s.feeColLabel, { textAlign: 'right' }]}>AMOUNT (₹)</Text>
          </View>
          {feeItems.map(item => (
            <View key={item.id} style={s.feeItemRow}>
              <TextInput
                style={[s.feeInput, { flex: 2 }]}
                placeholder="e.g., Tuition Fee"
                placeholderTextColor="#94A3B8"
                value={item.description}
                onChangeText={v => updateFeeItem(item.id, 'description', v)}
              />
              <TextInput
                style={[s.feeInput, { flex: 1, marginLeft: 10 }]}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={item.amount}
                onChangeText={v => updateFeeItem(item.id, 'amount', v)}
              />
              <TouchableOpacity style={s.feeRemoveBtn} onPress={() => removeFeeItem(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addFeeBtn} onPress={addFeeItem}>
            <Ionicons name="add" size={14} color="#7C3AED" />
            <Text style={s.addFeeText}>Add Fee Item</Text>
          </TouchableOpacity>
        </View>

        {/* Due Date & Month */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Due Date <Text style={s.required}>*</Text></Text>
            <TextInput
              style={s.dateInput}
              placeholder="dd-mm-yyyy"
              placeholderTextColor="#94A3B8"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Month <Text style={s.required}>*</Text></Text>
            <TouchableOpacity style={s.selectBox} onPress={() => setMonthDropdownOpen(!monthDropdownOpen)}>
              <Text style={[s.selectText, !month && { color: '#94A3B8' }]}>
                {month || 'Select month'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#94A3B8" />
            </TouchableOpacity>
            {monthDropdownOpen && (
              <View style={[s.dropdown, { maxHeight: 200 }]}>
                <ScrollView nestedScrollEnabled>
                  {MONTHS.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.dropdownItem, month === m && s.dropdownItemActive]}
                      onPress={() => { setMonth(m); setMonthDropdownOpen(false); }}
                    >
                      <Text style={[s.dropdownText, month === m && { color: '#7C3AED', fontWeight: '700' }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Total */}
        {totalAmount > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Amount:</Text>
            <Text style={s.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={s.submitBtnText}>Review & Preview</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  required: { color: '#EF4444' },

  selectBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF',
  },
  selectIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  selectText: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },

  dropdown: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownItemActive: { backgroundColor: '#F5F3FF' },
  dropdownText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  dropdownEmpty: { padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  studentsBox: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    backgroundColor: '#FAFAFA', overflow: 'hidden', maxHeight: 240,
  },
  studentsPlaceholder: { padding: 24, alignItems: 'center', gap: 8 },
  studentsPlaceholderText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  selectAllRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  selectAllText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  studentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  studentItemText: { fontSize: 13, color: '#334155', fontWeight: '500' },

  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },

  feeItemsBox: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    backgroundColor: '#FFFFFF', padding: 14,
  },
  feeItemsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  feeColLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' },
  feeItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  feeInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  feeRemoveBtn: { marginLeft: 8, padding: 6 },
  addFeeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  addFeeText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },

  dateInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, padding: 16, backgroundColor: '#F5F3FF', borderRadius: 14,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#7C3AED' },

  footer: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});

export default PrincipalCreateInvoiceScreen;
