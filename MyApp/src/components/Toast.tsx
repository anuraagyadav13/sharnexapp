import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, TouchableOpacity } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withSequence,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withAlpha, LIGHT_COLORS } from '../constants/theme';
const theme = LIGHT_COLORS;

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
  onUndo?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onHide, duration = 3000, onUndo }) => {
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, duration);
    return () => clearTimeout(timer);
  }, [onHide, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return theme.success;
      case 'error': return theme.danger;
      case 'warning': return theme.warning;
      default: return theme.primary;
    }
  };

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.container, 
        { top: insets.top + (Platform.OS === 'ios' ? 0 : 10) }
      ]}
    >
      <View style={[styles.content, { borderLeftColor: getColor() }]}>
        <View style={[styles.iconBg, { backgroundColor: `${getColor()}15` }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        {onUndo && (
          <TouchableOpacity onPress={() => { onUndo(); onHide(); }} style={styles.undoBtn}>
            <Text style={styles.undoText}>UNDO</Text>
          </TouchableOpacity>
        )}
        <Ionicons name="close" size={20} color={theme.subtext} onPress={onHide} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  content: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '500',
    lineHeight: 18,
  },
  undoBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: withAlpha(theme.primary, 0.1), borderRadius: 8, marginRight: 8 },
  undoText: { fontSize: 11, fontWeight: '800', color: theme.primary },
});

export default Toast;
