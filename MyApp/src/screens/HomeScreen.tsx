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
} from 'react-native';

const { width } = Dimensions.get('window');

const featuresData = [
  { icon: '👥', title: 'Student Management', description: 'Comprehensive student profiles, enrollment, and academic tracking' },
  { icon: '💵', title: 'Fees Management', description: 'Automated fee collection, payment tracking, and financial reports', isNew: true },
  { icon: '📋', title: 'Attendance', description: 'Real-time attendance tracking with automated notifications' },
  { icon: '📝', title: 'Exams', description: 'Schedule, conduct, and manage examinations seamlessly' },
  { icon: '🏆', title: 'Results', description: 'Generate and publish results with detailed analytics' },
  { icon: '🧠', title: 'AI Attendance', description: 'Intelligent attendance system powered by machine learning', isComingSoon: true },
];

const HomeScreen = () => {
  const [currentFeaturePage, setCurrentFeaturePage] = useState(1);
  const [isYearly, setIsYearly] = useState(false);

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
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Book a Demo</Text>
        </TouchableOpacity>

        {/* Dashboard Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../assets/laptop_dashboard.png')}
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
              <View style={{flexDirection: 'row'}}>
                {feat.isNew && <Text style={styles.newBadgeCentered}>New</Text>}
                {feat.isComingSoon && <Text style={styles.comingSoonBadgeCentered}>Coming Soon</Text>}
              </View>
              <Text style={styles.featureCardDescriptionCentered}>{feat.description}</Text>
            </View>
          ))}
        </View>

        {/* Pagination controls for Features */}
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
  menuButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', gap: 5 },
  hamburgerLine: { width: 22, height: 2, backgroundColor: '#374151', borderRadius: 1 },
  heroSection: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '700', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  heroTitleAccent: { color: '#6366F1' },
  heroDescription: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 16, marginBottom: 32, lineHeight: 24 },
  primaryButton: { width: '100%', height: 50, backgroundColor: '#6366F1', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { width: '100%', height: 50, backgroundColor: '#FFA500', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  heroImageContainer: { width: '100%', aspectRatio: 1.5, marginTop: 32, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '110%', height: '110%' },
  
  featuresSection: { paddingHorizontal: 24, paddingVertical: 40, backgroundColor: '#FAFAFF', alignItems: 'center' },
  platformFeaturesLabel: { fontSize: 12, fontWeight: '600', color: '#6366F1', marginBottom: 8 },
  featuresTitle: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  featuresTitleHighlight: { fontSize: 28, fontWeight: '700', color: '#7C3AED', marginBottom: 16, textAlign: 'center' },
  featuresSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 20, textAlign: 'center' },
  featureGridContainer: { gap: 16, width: '100%' },
  
  featureCardCentered: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, width: '100%', marginBottom: 16 },
  featureIconContainerCentered: { backgroundColor: '#F8F9FA', width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  featureIcon: { fontSize: 36 },
  featureCardTitleCentered: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
  featureCardDescriptionCentered: { fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'center' },
  newBadgeCentered: { backgroundColor: '#DEF7EC', color: '#03543F', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  comingSoonBadgeCentered: { backgroundColor: '#FEF2F2', color: '#9B1C1C', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 16, overflow: 'hidden', marginLeft: 8 },
  
  paginationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 },
  pageButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  pageButtonText: { color: '#9CA3AF', fontSize: 18, fontWeight: '500' },
  pageNumberButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  pageNumberButtonActive: { backgroundColor: '#7C3AED' },
  pageNumberText: { color: '#4B5563', fontSize: 16, fontWeight: '600' },
  pageNumberTextActive: { color: '#FFFFFF' },

  pricingSection: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  pricingBadgeContainer: { backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  pricingBadgeText: { color: '#7C3AED', fontSize: 12, fontWeight: '600' },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  switchStyle: { transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] },
  saveBadge: { backgroundColor: '#DEF7EC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  saveBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600' },

  pricingCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, width: '100%', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, marginBottom: 24 },
  pricingIconContainer: { backgroundColor: '#F3F4F6', width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pricingIcon: { fontSize: 24 },
  pricingPlanName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  pricingPlanDesc: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  pricingPrice: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 24 },
  pricingPeriod: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  pricingFeaturesList: { gap: 16, marginBottom: 32 },
  pricingFeatureItem: { fontSize: 14, color: '#4B5563', flexShrink: 1 },
  getStartedButton: { width: '100%', height: 56, backgroundColor: '#111827', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  getStartedButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  
  pricingDotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24 },
  pricingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  pricingDotActive: { backgroundColor: '#A78BFA' },
  pricingFooterText: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  pricingContactLink: { color: '#7C3AED', fontWeight: '600' },

  includedFeaturesCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: '#F1F5F9' },
  includedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  checkSquare: { width: 32, height: 32, backgroundColor: '#EDE9FE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkSquareText: { color: '#7C3AED', fontSize: 16, fontWeight: 'bold' },
  includedTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  includedGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  includedColumn: { gap: 12 },
  includedItem: { fontSize: 13, color: '#475569', fontWeight: '500' },

  contactSection: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center', backgroundColor: '#FAFAFF' },
  contactContainer: { width: '100%', backgroundColor: '#6366F1', borderRadius: 24, marginTop: 24, overflow: 'hidden' },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  contactHeaderText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  contactHeaderIcon: { color: '#FFFFFF', fontSize: 24 },
  contactForm: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  inputField: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
  inputFieldActive: { borderColor: '#A78BFA', backgroundColor: '#FFFFFF' },
  textArea: { height: 120, paddingTop: 16 },
  sendButton: { width: '100%', height: 56, backgroundColor: '#3B82F6', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  footer: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#F3F4F6', alignItems: 'center', width: '100%' },
  footerText: { fontSize: 14, color: '#9CA3AF' },
});

export default HomeScreen;
