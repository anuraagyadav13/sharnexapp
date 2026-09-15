import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { useTheme } from '../../store/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (asset: Asset) => void;
  title?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onImageSelected,
  title = 'Select Photo',
}) => {
  const { theme, isDarkMode } = useTheme();
  const { requestCamera, requestPhotoLibrary } = usePermissions();
  const styles = getStyles(theme, isDarkMode);

  const handleResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }
    if (response.errorMessage) {
      console.warn('[ImagePickerModal] Error:', response.errorMessage);
      return;
    }
    if (response.assets && response.assets.length > 0) {
      onImageSelected(response.assets[0]);
      onClose();
    }
  };

  const handleTakePhoto = async () => {
    const permResult = await requestCamera();
    if (permResult === 'granted') {
      try {
        const response = await launchCamera({
          mediaType: 'photo',
          cameraType: 'back',
          quality: 0.8,
          saveToPhotos: true,
        });
        handleResponse(response);
      } catch (err) {
        console.warn('[ImagePickerModal] launchCamera error:', err);
      }
    }
  };

  const handleChooseFromGallery = async () => {
    const permResult = await requestPhotoLibrary();
    if (permResult === 'granted') {
      try {
        const response = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 1,
          quality: 0.8,
        });
        handleResponse(response);
      } catch (err) {
        console.warn('[ImagePickerModal] launchImageLibrary error:', err);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSub}>Choose an option to upload your photo</Text>

              <View style={styles.divider} />

              {/* Option 1: Take Photo */}
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: isDarkMode ? '#26174A' : '#F5F3FF' }]}
                activeOpacity={0.75}
                onPress={handleTakePhoto}
              >
                <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Take Photo</Text>
                  <Text style={styles.optionDesc}>Capture photo directly using device camera</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
              </TouchableOpacity>

              {/* Option 2: Choose from Gallery */}
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: isDarkMode ? '#0F2942' : '#EFF6FF' }]}
                activeOpacity={0.75}
                onPress={handleChooseFromGallery}
              >
                <View style={[styles.iconBox, { backgroundColor: '#2563EB' }]}>
                  <Ionicons name="images-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDesc}>Select existing image from photo library</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#2563EB" />
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
      padding: 16,
    },
    modalCard: {
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
    },
    modalSub: {
      fontSize: 12,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 16,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
      marginBottom: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    optionDesc: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
    },
    cancelBtn: {
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
      marginTop: 4,
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
  });
