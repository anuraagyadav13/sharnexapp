import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../store/AuthContext';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

type Props = NativeStackScreenProps<
  RootStackParamList,
  'TeacherAddEquipmentRequest'
>;

interface EquipmentItem {
  id?: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  itemNote: string;
}

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'LOW', color: '#10B981' },
  { label: 'Medium', value: 'MEDIUM', color: '#F59E0B' },
  { label: 'High', value: 'HIGH', color: '#EF4444' },
  { label: 'Urgent', value: 'URGENT', color: '#B91C1C' },
];

const TeacherAddEquipmentRequestScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { authState } = useAuth();
  const requestId = route.params?.requestId;
  const isEditing = !!requestId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [neededByDate, setNeededByDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [teacherNote, setTeacherNote] = useState('');
  const [items, setItems] = useState<EquipmentItem[]>([
    { itemName: '', requestedQuantity: 1, unit: 'unit', itemNote: '' },
  ]);

  useEffect(() => {
    if (isEditing) {
      loadRequestData();
    }
  }, [isEditing]);

  const loadRequestData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(
        ENDPOINTS.TEACHER.EQUIPMENT.DETAIL(requestId!),
      );
      const data = res.data?.data || res.data;
      if (data) {
        setPurpose(data.purpose || '');
        setPriority(data.priority || 'MEDIUM');
        setNeededByDate(
          data.needed_by_date ? new Date(data.needed_by_date) : new Date(),
        );
        setTeacherNote(data.teacher_note || '');
        setItems(
          data.items.map((item: any) => ({
            id: item.id,
            itemName: item.item_name,
            requestedQuantity: parseFloat(item.requested_quantity),
            unit: item.unit,
            itemNote: item.item_note || '',
          })),
        );
      }
    } catch (error) {
      console.error('Failed to load request data:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemName: '', requestedQuantity: 1, unit: 'unit', itemNote: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (
    index: number,
    field: keyof EquipmentItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validateForm = () => {
    if (purpose.length < 5) {
      Alert.alert(
        'Validation Error',
        'Purpose must be at least 5 characters long',
      );
      return false;
    }
    if (items.some(item => !item.itemName.trim())) {
      Alert.alert('Validation Error', 'All items must have a name');
      return false;
    }
    return true;
  };

  const handleSave = async (submit = false) => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload = {
        purpose,
        priority,
        neededByDate: neededByDate.toISOString(),
        teacherNote,
        items: items.map(item => ({
          id: item.id,
          itemName: item.itemName,
          requestedQuantity: item.requestedQuantity,
          unit: item.unit,
          itemNote: item.itemNote,
        })),
      };

      let currentId = requestId;
      if (isEditing) {
        await apiClient.put(
          ENDPOINTS.TEACHER.EQUIPMENT.UPDATE(requestId),
          payload,
        );
      } else {
        const res = await apiClient.post(
          ENDPOINTS.TEACHER.EQUIPMENT.CREATE,
          payload,
        );
        currentId = res.data?.data?.id || res.data?.id;
      }

      if (submit && currentId) {
        await apiClient.post(ENDPOINTS.TEACHER.EQUIPMENT.SUBMIT(currentId));
        Alert.alert('Success', 'Request submitted successfully!');
      } else {
        Alert.alert(
          'Success',
          `Request ${isEditing ? 'updated' : 'saved as draft'}`,
        );
      }

      navigation.navigate('TeacherEquipment');
    } catch (error: any) {
      console.error('Failed to save request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save equipment request',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Request' : 'New Equipment Request'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section: Request Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color="#4F46E5"
              />
              <Text style={styles.sectionTitle}>Request Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Purpose / Reason for Request{' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Science lab experiment, Classroom renovation, etc."
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Priority Level</Text>
                <View style={styles.priorityGrid}>
                  {PRIORITY_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.priorityItem,
                        priority === opt.value && {
                          backgroundColor: opt.color,
                          borderColor: opt.color,
                        },
                      ]}
                      onPress={() => setPriority(opt.value)}
                    >
                      <Text
                        style={[
                          styles.priorityLabel,
                          priority === opt.value && { color: '#FFF' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Needed By Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748B" />
                <Text style={styles.dateValue}>
                  {neededByDate.toDateString()}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={neededByDate}
                  mode="date"
                  display="default"
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) setNeededByDate(selectedDate);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Note (Internal)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific details or context for the principal..."
                value={teacherNote}
                onChangeText={setTeacherNote}
                multiline
                numberOfLines={2}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Section: Requested Items */}
          <View style={styles.section}>
            <View
              style={[
                styles.sectionHeader,
                { justifyContent: 'space-between' },
              ]}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={20}
                  color="#4F46E5"
                />
                <Text style={styles.sectionTitle}>Requested Items</Text>
              </View>
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={handleAddItem}
              >
                <Ionicons name="add" size={18} color="#4F46E5" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <Animated.View
                key={index}
                layout={Layout.springify()}
                entering={FadeIn.duration(300)}
                style={styles.itemCard}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemIndex}>Item #{index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.labelSmall}>
                    Item Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="e.g. Projector Lamp, Whiteboard Markers"
                    value={item.itemName}
                    onChangeText={val => updateItem(index, 'itemName', val)}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.row}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.labelSmall}>Qty</Text>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="1"
                      keyboardType="numeric"
                      value={String(item.requestedQuantity)}
                      onChangeText={val =>
                        updateItem(
                          index,
                          'requestedQuantity',
                          parseFloat(val) || 0,
                        )
                      }
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.labelSmall}>Unit</Text>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="unit, box, kg, etc."
                      value={item.unit}
                      onChangeText={val => updateItem(index, 'unit', val)}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                  <Text style={styles.labelSmall}>Specification / Notes</Text>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="e.g. Model X, Blue color, must be compatible with..."
                    value={item.itemNote}
                    onChangeText={val => updateItem(index, 'itemNote', val)}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.primaryActions}>
              <TouchableOpacity
                style={[styles.btn, styles.draftBtn]}
                onPress={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.draftBtnText}>Save as Draft</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.submitBtn]}
                onPress={() => handleSave(true)}
                disabled={isSaving}
              >
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  labelSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  inputSmall: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  row: { flexDirection: 'row' },

  priorityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityItem: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  priorityLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateValue: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1E293B' },

  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  addItemText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFBFE',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIndex: { fontSize: 12, fontWeight: '800', color: '#6366F1' },

  footerActions: { gap: 12, marginTop: 10 },
  primaryActions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '700' },
  draftBtn: { backgroundColor: '#8B5CF6' },
  draftBtnText: { color: '#FFF', fontWeight: '700' },
  submitBtn: { backgroundColor: '#4F46E5', flex: 1.5 },
  submitBtnText: { color: '#FFF', fontWeight: '700' },
});

export default TeacherAddEquipmentRequestScreen;
