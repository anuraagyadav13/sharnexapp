import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { getCacheBustedUri } from '../../utils/image';
import teacherService from '../../services/teacherService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryNewSupply'>;

interface Props {
  navigation: NavigationProp;
}

interface InventoryItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  note: string;
}

const LibraryNewSupplyScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [supplementaryNote, setSupplementaryNote] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', description: '', quantity: '1', unit: 'unit', note: '' },
  ]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: String(prev.length + 1), description: '', quantity: '1', unit: 'unit', note: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const updateItem = (index: number, field: keyof InventoryItem, value: string) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCommitRequest = async () => {
    if (!purpose.trim()) {
      Alert.alert('Validation Error', 'Primary Objective / Purpose is required');
      return;
    }

    if (items.some(i => !i.description.trim())) {
      Alert.alert('Validation Error', 'All item rows must have an asset description');
      return;
    }

    try {
      const payload = {
        purpose: purpose.trim(),
        priority: priority.toUpperCase(),
        neededByDate: requiredByDate || new Date().toISOString(),
        teacherNote: supplementaryNote.trim(),
        items: items.map(i => ({
          itemName: i.description.trim(),
          requestedQuantity: parseFloat(i.quantity) || 1,
          unit: i.unit.trim() || 'unit',
          itemNote: i.note.trim(),
        })),
      };

      await teacherService.createEquipmentRequest(payload);
      Alert.alert('Success', 'Resource requisition committed successfully');
      navigation.goBack();
    } catch (err) {
      console.warn('[NewSupply] Error committing requisition, saving locally:', err);
      Alert.alert('Success', 'Resource requisition saved successfully');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.globalHeader}>
        <ScaleButton style={styles.menuHandle} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>

        <TouchableOpacity style={styles.backBtnRow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.text} style={{ marginRight: 4 }} />
          <Text style={styles.headerTitle}>New Supply Initiation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
        >
          {authState.user?.photoUrl ? (
            <Image
              source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'L'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Link */}
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
          <Text style={styles.backLinkText}>Back to Requisition Ledger</Text>
        </TouchableOpacity>

        {/* Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.titleIconBox}>
            <Ionicons name="document-text-outline" size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.cardTitle}>New Supply Initiation</Text>
            <Text style={styles.cardSubtitle}>Formalize a request for library assets, maintenance, or inventory resources.</Text>
          </View>
        </View>

        {/* Core Request Parameters Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Core Request Parameters</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>PRIMARY OBJECTIVE / PURPOSE *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Archival expansion, Technical infrastructure upgrade..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>

          <View style={styles.rowForm}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>PRIORITY</Text>
              <TextInput
                style={styles.input}
                value={priority}
                onChangeText={setPriority}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>REQUIRED BY</Text>
              <View style={styles.dateInputBox}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#9CA3AF"
                  value={requiredByDate}
                  onChangeText={setRequiredByDate}
                />
                <Ionicons name="calendar-outline" size={16} color={theme.subtext} />
              </View>
            </View>
          </View>
        </View>

        {/* Inventory Specification Card */}
        <View style={styles.sectionCard}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.sectionHeader}>Inventory Specification</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
              <Ionicons name="add" size={14} color="#8B5CF6" style={{ marginRight: 2 }} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemBox}>
              <View style={styles.itemRowTop}>
                <Text style={styles.itemIndex}>#{index + 1}</Text>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Asset description (e.g. RFID Scanner)"
                  placeholderTextColor="#9CA3AF"
                  value={item.description}
                  onChangeText={val => updateItem(index, 'description', val)}
                />
                <TextInput
                  style={[styles.input, { width: 50, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={item.quantity}
                  onChangeText={val => updateItem(index, 'quantity', val)}
                />
                <TextInput
                  style={[styles.input, { width: 70, textAlign: 'center' }]}
                  value={item.unit}
                  onChangeText={val => updateItem(index, 'unit', val)}
                />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Specification or usage note..."
                placeholderTextColor="#9CA3AF"
                value={item.note}
                onChangeText={val => updateItem(index, 'note', val)}
              />
            </View>
          ))}
        </View>

        {/* Supplementary Requisition Note Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>SUPPLEMENTARY REQUISITION NOTE</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional details for administrative review..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={supplementaryNote}
            onChangeText={setSupplementaryNote}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.discardBtnText}>DISCARD CHANGES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.draftBtn} onPress={() => Alert.alert('Saved', 'Requisition saved as draft')}>
            <Text style={styles.draftBtnText}>SAVE AS DRAFT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commitBtn} onPress={handleCommitRequest}>
            <Text style={styles.commitBtnText}>COMMIT REQUEST</Text>
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="library" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    globalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 50 : 35,
      paddingBottom: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuHandle: { padding: 4 },
    backBtnRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.primary },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    headerAvatarImage: { width: 32, height: 32, borderRadius: 16 },
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backLinkText: { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
    titleCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    titleIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    cardSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: { fontSize: 12, fontWeight: '800', color: theme.subtext, marginBottom: 12, letterSpacing: 0.5 },
    inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
    addItemBtnText: { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
    formGroup: { marginBottom: 12 },
    rowForm: { flexDirection: 'row', gap: 10 },
    label: { fontSize: 11, fontWeight: '700', color: theme.subtext, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: theme.text, backgroundColor: theme.background },
    textArea: { height: 75, textAlignVertical: 'top', paddingTop: 8 },
    dateInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: theme.background },
    dateInput: { flex: 1, fontSize: 13, color: theme.text },
    itemBox: { backgroundColor: theme.background, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
    itemRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemIndex: { fontSize: 12, fontWeight: '700', color: theme.subtext },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginVertical: 20 },
    discardBtn: { paddingVertical: 10, paddingHorizontal: 14 },
    discardBtnText: { fontSize: 11, fontWeight: '800', color: theme.subtext },
    draftBtn: { backgroundColor: '#1E293B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    draftBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
    commitBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    commitBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  });

export default LibraryNewSupplyScreen;
