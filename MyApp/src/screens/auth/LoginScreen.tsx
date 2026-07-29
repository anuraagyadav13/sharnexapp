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
  SafeAreaView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle } from 'react-native-svg';
import FadeInView from '../../components/animations/FadeInView';
import ScaleButton from '../../components/animations/ScaleButton';
import ThemeToggle from '../../components/common/ThemeToggle';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useTheme } from '../../store/ThemeContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const EyeIcon = ({ show, color }: { show: boolean; color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { theme, isDarkMode } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = getStyles(theme);

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

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const payload = response.data.data;
      if (!payload || !payload.user) {
        throw new Error('Invalid login response from server');
      }

      const user = payload.user;

      let appRole: 'student' | 'teacher' | 'principal' = 'student';
      const backendRole = user.role;
      if (backendRole === 'TEACHER' || backendRole === 'STAFF') appRole = 'teacher';
      else if (
        backendRole === 'INSTITUTION_ADMIN' ||
        backendRole === 'CENTRAL_ADMIN' ||
        backendRole === 'PRINCIPAL'
      )
        appRole = 'principal';

      showToast('Login successful! Welcome back.', 'success');
      await apiClient.get('/auth/csrf');

      login('', '', appRole, user);
    } catch (error: any) {
      console.error('Login Error:', error);
      let message = 'Something went wrong. Please try again.';

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === 'Network Error') {
        message = 'Network Error: Could not connect to server. Please check your internet connection.';
      } else if (error.message) {
        message = error.message;
      }

      const displayMessage =
        message.length > 100 ? message.substring(0, 97) + '...' : message;
      showToast(displayMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.wordmark}>Sharnex</Text>
        </View>

        <ThemeToggle iconColor={theme.text} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={100} duration={400}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to your account to access your dashboard
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={200} duration={500} translateYStart={20}>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email or Student ID</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.subtext}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email or ID"
                    placeholderTextColor={theme.placeholder}
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={theme.subtext}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeBtn}
                  >
                    <EyeIcon show={showPassword} color={theme.subtext} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() => navigation.navigate('ForgotPassword' as never)}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <ScaleButton
                style={styles.loginBtnWrapper}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                <View style={[styles.loginBtnBackground, isSubmitting && { opacity: 0.7 }]}>
                  <Text style={styles.loginButtonText}>
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </Text>
                </View>
              </ScaleButton>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.ssoButton}
                activeOpacity={0.7}
                onPress={() =>
                  showToast('SSO sign-in is enabled for registered institution portals', 'info')
                }
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.ssoButtonText}>
                  Continue with Institution SSO
                </Text>
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  New here?{' '}
                  <Text
                    style={styles.footerLink}
                    onPress={() =>
                      showToast('Please contact your school administrator to obtain access credentials', 'info')
                    }
                  >
                    Contact your institution
                  </Text>
                </Text>
              </View>
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 28) : 12,
      paddingBottom: 12,
      backgroundColor: theme.background,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wordmark: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    welcomeContainer: {
      marginBottom: 24,
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.subtext,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      height: 52,
      paddingHorizontal: 14,
    },
    leadingIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      height: '100%',
    },
    eyeBtn: {
      paddingLeft: 8,
    },
    forgotContainer: {
      alignSelf: 'flex-end',
      marginBottom: 24,
      marginTop: 2,
    },
    forgotText: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '600',
    },
    loginBtnWrapper: {
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 20,
    },
    loginBtnBackground: {
      height: 52,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
    ssoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      marginBottom: 20,
    },
    ssoButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    footerContainer: {
      alignItems: 'center',
      marginTop: 4,
    },
    footerText: {
      fontSize: 13,
      color: theme.subtext,
    },
    footerLink: {
      color: theme.primary,
      fontWeight: '600',
    },
  });

export default LoginScreen;
