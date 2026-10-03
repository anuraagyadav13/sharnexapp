import React from 'react';
import { View, StyleSheet, DimensionValue, ViewStyle } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { withAlpha } from '../../constants/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Spotify-style Simple Pulse Skeleton.
 * Clean, lightweight, and professional.
 */
const Skeleton: React.FC<SkeletonProps> = (props) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const {  
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
 } = props;
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { width, height, borderRadius }, 
        animatedStyle,
        style
      ]} 
    />
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  skeleton: {
    backgroundColor: withAlpha(theme.border, 0.5),
  },
});

export default Skeleton;
