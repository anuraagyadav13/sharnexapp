import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LIBRARY_COLORS } from '../theme';

interface LibraryModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={LIBRARY_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: LIBRARY_COLORS.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: LIBRARY_COLORS.card,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.border,
    borderRadius: 16,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: LIBRARY_COLORS.text,
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  closeBtn: {
    backgroundColor: LIBRARY_COLORS.border,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LibraryModal;
