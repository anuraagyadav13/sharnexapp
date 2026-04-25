import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { LinearGradient, Stop, Defs, Rect, Path } from 'react-native-svg';
import FadeInView from '../../components/animations/FadeInView';
import ScaleButton from '../../components/animations/ScaleButton';
import { RootStackParamList } from '../../types/navigation';
import { useToast } from '../../store/ToastContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const ChevronBackIcon = ({ width = 18, height = 18 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15.75 19.5L8.25 12l7.5-7.5" />
  </Svg>
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleResetRequest = async () => {
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: email.trim() });
      
      if (response.data.success) {
        showToast('Success! A reset code has been sent to your email.', 'success');
        navigation.navigate('ResetPassword', { email });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset code. Please try again.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Absolute SVG Gradient Background matching LoginScreen */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0" stopColor="#A855F7" />
              <Stop offset="0.5" stopColor="#9333EA" />
              <Stop offset="1" stopColor="#3B82F6" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      <FadeInView delay={100} duration={400} translateYStart={-10} style={styles.backButtonContainer}>
        <ScaleButton style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7} scaleTo={0.92}>
          <View style={styles.backIconSvg}>
            <ChevronBackIcon width={20} height={20} />
          </View>
          <Text style={styles.backText}>Back</Text>
        </ScaleButton>
      </FadeInView>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>

          <FadeInView delay={200} duration={500}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email to receive a recovery code</Text>
          </FadeInView>

          <FadeInView delay={300} duration={500} translateYStart={30}>
            <View style={styles.card}>
              <FadeInView delay={400}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </FadeInView>

              <FadeInView delay={600}>
                <ScaleButton 
                  style={[styles.button, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handleResetRequest} 
                  disabled={isSubmitting}
                  activeOpacity={0.85}>
                  <Text style={styles.buttonText}>{isSubmitting ? 'Sending...' : 'Send Reset Code'}</Text>
                </ScaleButton>
              </FadeInView>
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 45) : 45,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  backIconSvg: {
    marginRight: 2,
    marginLeft: -4,
  },
  backText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
