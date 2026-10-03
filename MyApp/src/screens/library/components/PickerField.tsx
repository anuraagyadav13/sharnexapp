import React, { useState } from 'react';
import { useTheme } from '../../../store/ThemeContext';
import { Theme, withAlpha } from '../../../constants/theme';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PickerOption } from '../types';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PickerFieldProps {
  label?: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  onSelect: (value: string) => void;
}

const PickerField: React.FC<PickerFieldProps> = ({
  label,
  value,
  options,
  placeholder = 'Select…',
  onSelect,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)} activeOpacity={0.8}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.placeholder} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? 'Select'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={theme.placeholder} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionActive]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: theme.placeholder,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trigger: {
    backgroundColor: theme.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    marginRight: 8,
  },
  placeholder: {
    color: theme.subtext,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.55,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionActive: {
    backgroundColor: withAlpha(theme.infoBg, 0.55),
  },
  optionText: {
    fontSize: 15,
    color: theme.textSecondary,
    flex: 1,
  },
  optionTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
});

export default PickerField;
