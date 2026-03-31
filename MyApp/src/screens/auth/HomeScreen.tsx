import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  Switch,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import ScaleButton from '../../components/animations/ScaleButton';

const { width } = Dimensions.get('window');

const featuresData = [
  { icon: '👥', title: 'Student Management', description: 'Comprehensive student profiles, enrollment, and academic tracking' },
  { icon: '💵', title: 'Fees Management', description: 'Automated fee collection, payment tracking, and financial reports', isNew: true },
  { icon: '📋', title: 'Attendance', description: 'Real-time attendance tracking with automated notifications' },
  { icon: '📝', title: 'Exams', description: 'Schedule, conduct, and manage examinations seamlessly' },
  { icon: '🏆', title: 'Results', description: 'Generate and publish results with detailed analytics' },
  { icon: '🧠', title: 'AI Attendance', description: 'Intelligent attendance system powered by machine learning', isComingSoon: true },
];

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const StaggeredFadeIn = ({ index, isVisible, children, delayOffset = 100 }: { index: number, isVisible: boolean, children: React.ReactNode, delayOffset?: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = withDelay(
      index * 45 + delayOffset,
      withTiming(isVisible ? 0 : 50, { duration: 400, easing: Easing.out(Easing.exp) })
    );
    const opacity = withDelay(
      index * 45 + delayOffset,
      withTiming(isVisible ? 1 : 0, { duration: 300 })
    );
    
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [currentFeaturePage, setCurrentFeaturePage] = useState(1);
  const [isYearly, setIsYearly] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Reanimated shared values
  const translateX = useSharedValue(width); // Start off-screen right
  const backdropOpacity = useSharedValue(0);
  const topRotation = useSharedValue(0);
  const middleOpacity = useSharedValue(1);
  const bottomRotation = useSharedValue(0);

  const toggleMenu = (show: boolean) => {
    if (show) {
      setIsMenuVisible(true);
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateX.value = withTiming(0, { 
        duration: 400, 
        easing: Easing.out(Easing.exp) 
      });
      // Animate hamburger to X
      topRotation.value = withTiming(45, { duration: 300 });
      middleOpacity.value = withTiming(0, { duration: 300 });
      bottomRotation.value = withTiming(-45, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 300 });
      translateX.value = withTiming(width, { 
        duration: 350, 
        easing: Easing.in(Easing.ease) 
      }, (finished) => {
        if (finished) runOnJS(setIsMenuVisible)(false);
      });
      // Animate back to hamburger
      topRotation.value = withTiming(0, { duration: 300 });
      middleOpacity.value = withTiming(1, { duration: 300 });
      bottomRotation.value = withTiming(0, { duration: 300 });
    }
  };

  const animatedDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const animatedTopLineStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${topRotation.value}deg` }],
  }));

  const animatedMiddleLineStyle = useAnimatedStyle(() => ({
    opacity: middleOpacity.value,
  }));

  const animatedBottomLineStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bottomRotation.value}deg` }],
  }));

  // 3 features per page
  const currentFeatures = currentFeaturePage === 1 
    ? featuresData.slice(0, 3) 
    : featuresData.slice(3, 6);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Sharnex</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.moonIcon}>☾</Text>
          </TouchableOpacity>
          <ScaleButton 
            style={styles.menuButton} 
            onPress={() => toggleMenu(true)}
            hitSlop={{top: 25, bottom: 25, left: 25, right: 25}}
            activeOpacity={0.6}
            scaleTo={0.85}
          >
            <Animated.View style={[styles.hamburgerLine, animatedTopLineStyle]} />
            <Animated.View style={[styles.hamburgerLine, animatedMiddleLineStyle]} />
            <Animated.View style={[styles.hamburgerLine, animatedBottomLineStyle]} />
          </ScaleButton>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Transform School</Text>
        <Text style={styles.heroTitle}>Management with</Text>
        <Text style={[styles.heroTitle, styles.heroTitleAccent]}>Sharnex</Text>
        
        <Text style={styles.heroDescription}>
          An all-in-one platform to streamline attendance, assignments, communication, and
          analytics for modern educational institutions.
        </Text>

        {/* CTA Buttons */}
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Start Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Book a Demo</Text>
        </TouchableOpacity>

        {/* Dashboard Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../../assets/laptop_dashboard.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.platformFeaturesLabel}>Platform Features</Text>
        <Text style={styles.featuresTitle}>Explore Sharnex</Text>
        <Text style={styles.featuresTitleHighlight}>Platform Features</Text>
        <Text style={styles.featuresSubtitle}>
          Discover powerful tools designed to streamline your educational institution's operations
        </Text>

        <View style={styles.featureGridContainer}>
          {currentFeatures.map((feat, idx) => (
            <View key={idx} style={styles.featureCardCentered}>
              <View style={styles.featureIconContainerCentered}>
                <Text style={styles.featureIcon}>{feat.icon}</Text>
              </View>
              <Text style={styles.featureCardTitleCentered}>{feat.title}</Text>
              <View style={styles.badgeRow}>
                {feat.isNew && <Text style={styles.newBadgeCentered}>New</Text>}
                {feat.isComingSoon && <Text style={styles.comingSoonBadgeCentered}>Coming Soon</Text>}
              </View>
              <Text style={styles.featureCardDescriptionCentered}>{feat.description}</Text>
            </View>
          ))}
        </View>

        {/* Pagination controls */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity 
            style={styles.pageButton} 
            onPress={() => setCurrentFeaturePage(1)}
            disabled={currentFeaturePage === 1}>
            <Text style={styles.pageButtonText}>{'<'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.pageNumberButton, currentFeaturePage === 1 && styles.pageNumberButtonActive]}
            onPress={() => setCurrentFeaturePage(1)}>
            <Text style={[styles.pageNumberText, currentFeaturePage === 1 && styles.pageNumberTextActive]}>1</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.pageNumberButton, currentFeaturePage === 2 && styles.pageNumberButtonActive]}
            onPress={() => setCurrentFeaturePage(2)}>
            <Text style={[styles.pageNumberText, currentFeaturePage === 2 && styles.pageNumberTextActive]}>2</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.pageButton} 
            onPress={() => setCurrentFeaturePage(2)}
            disabled={currentFeaturePage === 2}>
            <Text style={styles.pageButtonText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pricing Section */}
      <View style={styles.pricingSection}>
        <View style={styles.pricingBadgeContainer}>
          <Text style={styles.pricingBadgeText}>• Pricing Plans</Text>
        </View>
        <Text style={styles.featuresTitle}>Simple, Transparent</Text>
        <Text style={styles.featuresTitleHighlight}>Pricing</Text>
        <Text style={styles.featuresSubtitle}>
          Start with a 30-day free trial. No credit card required. All plans include the same powerful features.
        </Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Monthly</Text>
          <Switch 
            value={isYearly} 
            onValueChange={setIsYearly} 
            trackColor={{ false: '#E5E7EB', true: '#E5E7EB' }} 
            thumbColor={isYearly ? '#FFFFFF' : '#FFFFFF'} 
            ios_backgroundColor="#E5E7EB"
            style={styles.switchStyle}
          />
          <Text style={styles.toggleLabel}>Yearly</Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>Save up to 17%</Text>
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingIconContainer}>
            <Text style={styles.pricingIcon}>⚡</Text>
          </View>
          <Text style={styles.pricingPlanName}>Starter</Text>
          <Text style={styles.pricingPlanDesc}>Ideal for small schools</Text>
          
          <Text style={styles.pricingPrice}>
            {isYearly ? '₹14,990' : '₹1,499'}
            <Text style={styles.pricingPeriod}>{isYearly ? ' /year' : ' /month'}</Text>
          </Text>

          <View style={styles.pricingFeaturesList}>
            <Text style={styles.pricingFeatureItem}>✓  Up to 300 students</Text>
            <Text style={styles.pricingFeatureItem}>✓  Unlimited teachers</Text>
            <Text style={styles.pricingFeatureItem}>✓  AI analytics</Text>
            <Text style={styles.pricingFeatureItem}>✓  Daily backups</Text>
            <Text style={styles.pricingFeatureItem}>✓  WhatsApp support</Text>
          </View>

          <TouchableOpacity style={styles.getStartedButton}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.pricingDotsContainer}>
          <View style={[styles.pricingDot, styles.pricingDotActive]} />
          <View style={styles.pricingDot} />
          <View style={styles.pricingDot} />
          <View style={styles.pricingDot} />
        </View>
        
        <Text style={styles.pricingFooterText}>
          All prices in Indian Rupees (₹). Questions? <Text style={styles.pricingContactLink}>Contact our sales team</Text>
        </Text>

        {/* Included Features Card */}
        <View style={styles.includedFeaturesCard}>
          <View style={styles.includedHeaderRow}>
            <View style={styles.checkSquare}>
              <Text style={styles.checkSquareText}>✓</Text>
            </View>
            <Text style={styles.includedTitle}>All plans include:</Text>
          </View>
          
          <View style={styles.includedGrid}>
             <View style={styles.includedColumn}>
               <Text style={styles.includedItem}>✓ Teacher Management</Text>
               <Text style={styles.includedItem}>✓ Attendance</Text>
               <Text style={styles.includedItem}>✓ Assignments</Text>
               <Text style={styles.includedItem}>✓ Fees Management</Text>
             </View>
             <View style={styles.includedColumn}>
               <Text style={styles.includedItem}>✓ Administration</Text>
               <Text style={styles.includedItem}>✓ Quizzes</Text>
               <Text style={styles.includedItem}>✓ AI Analytics</Text>
             </View>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.featuresTitleHighlight}>Get in Touch</Text>
        <Text style={styles.featuresSubtitle}>
          Ready to transform your business? Let's talk.
        </Text>

        <View style={styles.contactContainer}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactHeaderText}>Contact Information</Text>
            <Text style={styles.contactHeaderIcon}>⌄</Text>
          </View>
          
          <View style={styles.contactForm}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.inputField} placeholder="Enter your full name" placeholderTextColor="#A0AEC0" />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput style={styles.inputField} placeholder="Enter your email address" placeholderTextColor="#A0AEC0" keyboardType="email-address" />

            <Text style={styles.inputLabel}>School</Text>
            <TextInput style={[styles.inputField, styles.inputFieldActive]} placeholder="Enter your School name" placeholderTextColor="#A0AEC0" />

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput 
              style={[styles.inputField, styles.textArea]} 
              placeholder="How can we help you?" 
              placeholderTextColor="#A0AEC0"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.sendButton}>
              <Text style={styles.sendButtonText}>↗ Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Sharnex. All rights reserved.</Text>
      </View>

      {/* Heavy-Lift Absolute Positioned Reanimated Drawer (No Modal = Smooth Performance) */}
      <View style={[StyleSheet.absoluteFill, styles.drawerOverlay]} pointerEvents={isMenuVisible ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
          <Animated.View style={[styles.modalOverlay, animatedBackdropStyle]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <ScaleButton onPress={() => toggleMenu(false)} hitSlop={{top: 25, left: 25, bottom: 25, right: 25}} scaleTo={0.8} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </ScaleButton>
          </View>

          <View style={styles.menuItemsContainer}>
            {['Home', 'Features', 'About Us', 'Pricing', 'Contact'].map((item, idx) => (
              <StaggeredFadeIn key={idx} index={idx} isVisible={isMenuVisible} delayOffset={150}>
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    toggleMenu(false);
                    if (item === 'Assignments') {
                      setTimeout(() => navigation.navigate('Assignments'), 300);
                    }
                  }}
                >
                  <Text style={styles.drawerItemText}>{item}</Text>
                </TouchableOpacity>
              </StaggeredFadeIn>
            ))}
          </View>

          <StaggeredFadeIn index={7} isVisible={isMenuVisible} delayOffset={200}>
            <ScaleButton 
              style={styles.drawerLoginButton}
              onPress={() => {
                toggleMenu(false);
                setTimeout(() => navigation.navigate('Login'), 300);
              }}
              activeOpacity={0.85}
              scaleTo={0.96}
            >
              <Text style={styles.drawerLoginText}>Login</Text>
            </ScaleButton>
          </StaggeredFadeIn>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  logo: { fontSize: 24, fontWeight: '800', color: '#7C3AED' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  moonIcon: { fontSize: 20, color: '#374151', lineHeight: 24 },
  menuButton: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', gap: 5 },
  hamburgerLine: { width: 22, height: 2, backgroundColor: '#111827', borderRadius: 1 },
  heroSection: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '700', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  heroTitleAccent: { color: '#6366F1' },
  heroDescription: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 16, marginBottom: 32, lineHeight: 24 },
  primaryButton: { width: '100%', height: 52, backgroundColor: '#6366F1', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { width: '100%', height: 52, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  heroImageContainer: { width: '100%', aspectRatio: 1.5, marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '110%', height: '110%' },
  
  featuresSection: { paddingHorizontal: 24, paddingVertical: 40, backgroundColor: '#FAFAFF', alignItems: 'center' },
  platformFeaturesLabel: { fontSize: 13, fontWeight: '700', color: '#6366F1', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featuresTitle: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  featuresTitleHighlight: { fontSize: 28, fontWeight: '800', color: '#7C3AED', marginBottom: 16, textAlign: 'center' },
  featuresSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 40, lineHeight: 24, textAlign: 'center' },
  featureGridContainer: { gap: 20, width: '100%' },
  
  featureCardCentered: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2, width: '100%', marginBottom: 16 },
  featureIconContainerCentered: { backgroundColor: '#F8F9FA', width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  featureIcon: { fontSize: 36 },
  featureCardTitleCentered: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
  featureCardDescriptionCentered: { fontSize: 14, color: '#64748B', lineHeight: 22, textAlign: 'center' },
  newBadgeCentered: { backgroundColor: '#DEF7EC', color: '#03543F', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  comingSoonBadgeCentered: { backgroundColor: '#FEF2F2', color: '#9B1C1C', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 16, overflow: 'hidden', marginLeft: 8 },
  
  paginationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 },
  pageButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  pageButtonText: { color: '#9CA3AF', fontSize: 18, fontWeight: '500' },
  pageNumberButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  pageNumberButtonActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  pageNumberText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  pageNumberTextActive: { color: '#FFFFFF' },

  pricingSection: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  pricingBadgeContainer: { backgroundColor: '#F3E8FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  pricingBadgeText: { color: '#7C3AED', fontSize: 13, fontWeight: '700' },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 32 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  switchStyle: { transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] },
  saveBadge: { backgroundColor: '#DEF7EC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  saveBadgeText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  pricingCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, width: '100%', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 5, marginBottom: 32 },
  pricingIconContainer: { backgroundColor: '#F3F4F6', width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  pricingIcon: { fontSize: 24 },
  pricingPlanName: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  pricingPlanDesc: { fontSize: 15, color: '#64748B', marginBottom: 24 },
  pricingPrice: { fontSize: 36, fontWeight: '800', color: '#111827', marginBottom: 24 },
  pricingPeriod: { fontSize: 16, fontWeight: '500', color: '#64748B' },
  pricingFeaturesList: { gap: 16, marginBottom: 32 },
  pricingFeatureItem: { fontSize: 15, color: '#334155', flexShrink: 1, fontWeight: '500' },
  getStartedButton: { width: '100%', height: 56, backgroundColor: '#111827', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#111827', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  getStartedButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  pricingDotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 32 },
  pricingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  pricingDotActive: { backgroundColor: '#8B5CF6' },
  pricingFooterText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 40 },
  pricingContactLink: { color: '#7C3AED', fontWeight: '700' },

  includedFeaturesCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, width: '100%', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  includedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  checkSquare: { width: 36, height: 36, backgroundColor: '#EDE9FE', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  checkSquareText: { color: '#7C3AED', fontSize: 18, fontWeight: 'bold' },
  includedTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  includedGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  includedColumn: { gap: 14 },
  includedItem: { fontSize: 14, color: '#475569', fontWeight: '500' },

  contactSection: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center', backgroundColor: '#FAFAFF' },
  contactContainer: { width: '100%', backgroundColor: '#4F46E5', borderRadius: 24, marginTop: 32, overflow: 'hidden', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28 },
  contactHeaderText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  contactHeaderIcon: { color: '#FFFFFF', fontSize: 24 },
  contactForm: { backgroundColor: '#FFFFFF', padding: 28, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 12 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 12, marginBottom: 6 },
  inputField: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B' },
  inputFieldActive: { borderColor: '#8B5CF6', backgroundColor: '#FFFFFF', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  textArea: { height: 120, paddingTop: 16 },
  sendButton: { width: '100%', height: 56, backgroundColor: '#3B82F6', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28, gap: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  footer: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#F1F5F9', alignItems: 'center', width: '100%' },
  footerText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackground: { flex: 1 },
  drawer: { flex: 1, position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#FFFFFF', paddingHorizontal: 28, shadowColor: '#000', shadowOffset: {width: -10, height: 0}, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 60 : 40, marginBottom: 40 },
  drawerTitle: { fontSize: 22, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5 },
  closeIcon: { fontSize: 26, color: '#334155', paddingBottom: 2 },
  menuItemsContainer: { gap: 32, marginBottom: 40 },
  drawerItem: { paddingVertical: 4 },
  drawerItemText: { fontSize: 17, fontWeight: '600', color: '#334155' },
  drawerLoginButton: { width: '100%', height: 54, backgroundColor: '#4F46E5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  drawerLoginText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  badgeRow: { flexDirection: 'row' },
  drawerOverlay: { zIndex: 999 },
});

export default HomeScreen;
