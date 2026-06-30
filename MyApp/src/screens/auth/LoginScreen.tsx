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
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { LinearGradient, Stop, Defs, Rect, Path, Circle } from 'react-native-svg';
import FadeInView from '../../components/animations/FadeInView';
import ScaleButton from '../../components/animations/ScaleButton';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      showToast('Please enter both email / student ID and password', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: identifier.trim(),
        password,
      });

      // Handle standardized response format
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

     // ======================================================
// TEMP FIX (2026-06-26)
// Backend now returns only the authenticated user.
// JWTs are delivered via HttpOnly cookies instead of
// response.data.tokens.
// ======================================================

const payload = response.data.data;

if (!payload || !payload.user) {
    throw new Error("Invalid login response from server");
}

const user = payload.user;
//changes made till here

      let appRole: 'student' | 'teacher' | 'principal' = 'student';
      const backendRole = user.role;
      if (backendRole === 'TEACHER' || backendRole === 'STAFF') appRole = 'teacher';
      else if (backendRole === 'INSTITUTION_ADMIN' || backendRole === 'CENTRAL_ADMIN' || backendRole === 'PRINCIPAL') appRole = 'principal';

     // ======================================================
// TEMP FIX (2026-06-26)
// Backend migrated to cookie authentication.
// Tokens are no longer returned in login response.
// Passing empty strings temporarily until AuthContext
// is updated.
// ======================================================

showToast('Login successful! Welcome back.', 'success');
await apiClient.get('/auth/csrf');
console.log(
  '[Login Set-Cookie]',
  response.headers['set-cookie']
);
console.log(
  JSON.stringify(response.headers['set-cookie'], null, 2)
);

login('', '', appRole, user);
//changes till here
    } catch (error: any) {
      console.error('Login Error:', error);
      console.log("STATUS:", error.response?.status);
      let message = 'Something went wrong. Please try again.';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      // Only show first 100 chars to keep toast readable
      const displayMessage = message.length > 100 ? message.substring(0, 97) + '...' : message;
      showToast(displayMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Absolute SVG Gradient Background matching target shade EXACTLY */}
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
        <ScaleButton style={styles.backButton} onPress={() => navigation.navigate('Home' as never)} activeOpacity={0.7} scaleTo={0.92}>
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
            <Text style={styles.title}>Welcome, Glad to see you!</Text>
          </FadeInView>

          <FadeInView delay={300} duration={500} translateYStart={30}>
            <View style={styles.card}>
              <FadeInView delay={400}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Student ID"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>
              </FadeInView>

              <FadeInView delay={500}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeBtn}>
                    <EyeIcon show={showPassword} />
                  </TouchableOpacity>
                </View>
              </FadeInView>

              <FadeInView delay={550}>
                <TouchableOpacity 
                  style={styles.forgotContainer}
                  onPress={() => navigation.navigate('ForgotPassword' as never)}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </FadeInView>

              <FadeInView delay={600}>
                <ScaleButton 
                  style={[styles.loginButton, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handleLogin} 
                  disabled={isSubmitting}
                  activeOpacity={0.85}>
                  <Text style={styles.loginButtonText}>{isSubmitting ? 'Loading...' : 'Login'}</Text>
                </ScaleButton>
              </FadeInView>


              {/* <FadeInView delay={900}>
                <View style={styles.bottomRow}>
                  <Text style={styles.bottomText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                    <Text style={styles.signUpText}>Sign Up Now</Text>
                  </TouchableOpacity>
                </View>
              </FadeInView> */}
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
    marginBottom: 16,
    letterSpacing: -0.3,
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
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 0,
  },
  forgotText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '700',
  },
});

export default LoginScreen;
