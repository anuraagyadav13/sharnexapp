import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  translateYStart?: number;
}

const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0, 
  duration = 500, // Adjusted duration for smooth ease-in-out
  style,
  translateYStart = 20 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(translateYStart);

  useEffect(() => {
    // Smooth transition using modern ease-out curve (premium app feel)
    const animConfig = { duration, easing: Easing.out(Easing.quad) };
    
    // Trigger animations immediately when rendered
    opacity.value = withDelay(delay, withTiming(1, animConfig));
    translateY.value = withDelay(delay, withTiming(0, animConfig));
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default FadeInView;
