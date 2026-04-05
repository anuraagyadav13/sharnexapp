import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ScaleButtonProps extends TouchableOpacityProps {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const ScaleButton: React.FC<ScaleButtonProps> = ({ 
  scaleTo = 0.96, // Slight pop, feels more premium
  activeOpacity = 0.85, 
  style, 
  children, 
  onPress, 
  onPressIn,
  onPressOut,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = (e: any) => {
    // Tighter spring for crisp micro-interaction
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300, mass: 1 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    // Bounce back perfectly
    scale.value = withSpring(1, { damping: 12, stiffness: 250, mass: 1 });
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchableOpacity
      {...props}
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};

export default ScaleButton;
