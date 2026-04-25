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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { LinearGradient, Stop, Defs, Rect, Path, Circle } from 'react-native-svg';
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

const EyeIcon = ({ show }: { show: boolean }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
    {!show && <Path d="M4 4l16 16" />}
  </Svg>
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { showToast } = useToast();

  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.trim(),
        token: code.trim(),
        newPassword
      });
      
      if (response.data.success) {
        showToast('Success! Your password has been reset.', 'success');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Choose a new secure password</Text>
          </FadeInView>

          <FadeInView delay={300} duration={500} translateYStart={30}>
            <View style={styles.card}>
              <FadeInView delay={400}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification Code"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                  />
                </View>
              </FadeInView>

              <FadeInView delay={500}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <EyeIcon show={showPassword} />
                  </TouchableOpacity>
                </View>
              </FadeInView>

              <FadeInView delay={550}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </FadeInView>

              <FadeInView delay={600}>
                <ScaleButton 
                  style={[styles.button, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handleReset} 
                  disabled={isSubmitting}
                  activeOpacity={0.85}>
                  <Text style={styles.buttonText}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Text>
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
    marginBottom: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ResetPasswordScreen;
