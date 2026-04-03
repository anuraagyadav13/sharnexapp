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


const ChevronBackIcon = ({ width = 18, height = 18 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15.75 19.5L8.25 12l7.5-7.5" />
  </Svg>
);

const GoogleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571L37.409 38.808C41.211 35.091 44 30.134 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </Svg>
);

const FacebookIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.246h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    <Path fill="#ffffff" d="M16.671 15.546l.532-3.469h-3.328V9.831c0-.949.465-1.874 1.956-1.874h1.534V5.004s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.639H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z" />
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = () => {
    if (password !== 'Krushna123') {
      Alert.alert('Login Failed', 'Invalid password. Please use Krushna123');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === 'student@sharnex.com') {
      login('dummy_student_token', 'student');
      navigation?.reset({ index: 0, routes: [{ name: 'StudentDashboard' as any }] });
    } else if (normalizedEmail === 'teacher@sharnex.com') {
      login('dummy_teacher_token', 'teacher');
      navigation?.reset({ index: 0, routes: [{ name: 'TeacherDashboard' as any }] });
    } else if (normalizedEmail === 'principal@sharnex.com') {
      login('dummy_principal_token', 'principal');
      navigation?.reset({ index: 0, routes: [{ name: 'PrincipalDashboard' as any }] });
    } else {
      Alert.alert('Login Failed', 'Please use student@sharnex.com, teacher@sharnex.com, or principal@sharnex.com');
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
                    placeholder="Email Address"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
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
                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </FadeInView>

              <FadeInView delay={600}>
                <ScaleButton style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </ScaleButton>
              </FadeInView>

              <FadeInView delay={700}>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or Login with</Text>
                  <View style={styles.dividerLine} />
                </View>
              </FadeInView>

              <FadeInView delay={800}>
                <View style={styles.socialRow}>
                  <ScaleButton style={styles.socialButton} activeOpacity={0.85} scaleTo={0.95}>
                    <GoogleIcon />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </ScaleButton>

                  <ScaleButton style={styles.socialButton} activeOpacity={0.85} scaleTo={0.95}>
                    <FacebookIcon />
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </ScaleButton>
                </View>
              </FadeInView>

              <FadeInView delay={900}>
                <View style={styles.bottomRow}>
                  <Text style={styles.bottomText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                    <Text style={styles.signUpText}>Sign Up Now</Text>
                  </TouchableOpacity>
                </View>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    fontSize: 13,
    color: '#64748B',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 36,
  },
  socialButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
