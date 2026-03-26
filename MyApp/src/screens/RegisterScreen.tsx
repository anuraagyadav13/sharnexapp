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
  shadow: '#000000',
  brandName: '#A78BFA',
};

const RegisterScreen = ({ navigation }: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const c = isDarkMode ? darkColors : lightColors;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }
    console.log('Register pressed', { fullName, email, schoolName, password });
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

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation?.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.logoMark}>
          <View style={styles.logoInner}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
        </View>
        <Text style={[styles.brandName, { color: c.brandName }]}>Sharnex</Text>
        <Text style={[styles.pageTitle, { color: c.text }]}>Create your account</Text>
        <Text style={[styles.pageSubtitle, { color: c.subText }]}>
          Join thousands of schools already using Sharnex
        </Text>
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: c.card, shadowColor: c.shadow }]}>

        <Text style={[styles.label, { color: c.label }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Your full name"
          placeholderTextColor={c.placeholder}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
        />

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

        <Text style={[styles.label, { color: c.label }]}>School Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Your institution's name"
          placeholderTextColor={c.placeholder}
          value={schoolName}
          onChangeText={setSchoolName}
        />

        <Text style={[styles.label, { color: c.label }]}>Password</Text>
        <View style={[styles.passwordContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <TextInput
            style={[styles.passwordInput, { color: c.text }]}
            placeholder="Create a strong password"
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

        <Text style={[styles.label, { color: c.label }]}>Confirm Password</Text>
        <View style={[styles.passwordContainer, { backgroundColor: c.inputBg, borderColor: c.inputBorder, marginBottom: 24 }]}>
          <TextInput
            style={[styles.passwordInput, { color: c.text }]}
            placeholder="Re-enter your password"
            placeholderTextColor={c.placeholder}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirm(!showConfirm)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.eyeText, { color: c.subText }]}>
              {showConfirm ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.8}>
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.termsText, { color: c.subText }]}>
            I agree to the{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.primaryButton, !agreedToTerms && styles.primaryButtonDisabled]}
          onPress={handleRegister}
          disabled={!agreedToTerms}
          activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Trial Badge */}
        <View style={styles.trialBadge}>
          <View style={styles.trialDot} />
          <Text style={styles.trialText}>30-day free trial — no credit card required</Text>
        </View>
      </View>

      {/* Login Link */}
      <View style={styles.bottomRow}>
        <Text style={[styles.bottomText, { color: c.subText }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
          <Text style={styles.linkText}>Sign In</Text>
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
    paddingTop: 52,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 28,
  },
  backArrow: { fontSize: 20, color: '#7C3AED', fontWeight: '600' },
  backText: { fontSize: 15, color: '#7C3AED', fontWeight: '600' },
  headerContainer: { alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoInner: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  logoLetter: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  brandName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
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
    marginBottom: 16,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  termsText: { fontSize: 13, flex: 1, lineHeight: 20 },
  termsLink: { color: '#7C3AED', fontWeight: '600' },
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
  primaryButtonDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  trialDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  trialText: { fontSize: 12, color: '#059669', fontWeight: '500', lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  bottomText: { fontSize: 14 },
  linkText: { fontSize: 14, color: '#7C3AED', fontWeight: '700' },
});

export default RegisterScreen;