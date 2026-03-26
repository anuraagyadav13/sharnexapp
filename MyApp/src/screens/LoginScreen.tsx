import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  useColorScheme,
} from 'react-native';

const lightColors = {
  bg: '#F8F7FF',
  card: '#FFFFFF',
  text: '#1F1B4E',
  subText: '#6B7280',
  label: '#374151',
  placeholder: '#C4C4D4',
  inputBg: '#F9F8FF',
  inputBorder: '#EDE9FE',
  divider: '#F3F4F6',
  shadow: '#1F1B4E',
  brandName: '#7C3AED',
};

const darkColors = {
  bg: '#0F0E1A',
  card: '#1C1B2E',
  text: '#F3F4F6',
  subText: '#9CA3AF',
  label: '#D1D5DB',
  placeholder: '#6B7280',
  inputBg: '#15142A',
  inputBorder: '#2D2B4E',
  divider: '#2D2B4E',
  shadow: '#000000',
  brandName: '#A78BFA',
};

const LoginScreen = ({ navigation }: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const c = isDarkMode ? darkColors : lightColors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log('Login pressed', { email, password });
    navigation?.navigate('Home');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={c.bg}
      />

      {/* Brand */}
      <View style={styles.brandContainer}>
        <View style={styles.logoMark}>
          <View style={styles.logoInner}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
        </View>
        <Text style={[styles.brandName, { color: c.brandName }]}>Sharnex</Text>
        <Text style={[styles.brandTagline, { color: c.subText }]}>School Management Platform</Text>
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: c.card, shadowColor: c.shadow }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Welcome back</Text>
        <Text style={[styles.cardSubtitle, { color: c.subText }]}>
          Sign in to your account to continue
        </Text>

        <Text style={[styles.label, { color: c.label }]}>Email Address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="you@school.edu"
          placeholderTextColor={c.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: c.label }]}>Password</Text>
        <View style={[styles.passwordContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <TextInput
            style={[styles.passwordInput, { color: c.text }]}
            placeholder="Enter your password"
            placeholderTextColor={c.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.eyeText, { color: c.subText }]}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotContainer}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <View style={styles.trustDot} />
          <Text style={styles.trustText}>Secured with 256-bit encryption</Text>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
          <Text style={[styles.dividerText, { color: c.subText }]}>or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
          activeOpacity={0.85}>
          <Text style={styles.googleG}>G</Text>
          <Text style={[styles.googleButtonText, { color: c.label }]}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.bottomText, { color: c.subText }]}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
          <Text style={styles.linkText}>Create one</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoInner: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  brandName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  brandTagline: { fontSize: 13, fontWeight: '500' },
  card: {
    width: '100%',
    borderRadius: 28,
    padding: 28,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 14, marginBottom: 28, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4, letterSpacing: 0.1 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 6 },
  forgotText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  trustDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  trustText: { fontSize: 12, fontWeight: '500', color: '#10B981' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#4285F4', lineHeight: 22 },
  googleButtonText: { fontSize: 15, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  bottomText: { fontSize: 14 },
  linkText: { fontSize: 14, color: '#7C3AED', fontWeight: '700' },
});

export default LoginScreen;