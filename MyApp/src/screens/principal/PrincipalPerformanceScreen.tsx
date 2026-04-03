import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Animated, { FadeInUp } from 'react-native-reanimated';

const PrincipalPerformanceScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* Standard Principal Header */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Welcome back, Anurag
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}>
            <Ionicons name="settings-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Titles */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Performance</Text>
          <Text style={styles.pageSubtitle}>View comprehensive analytics and performance reports.</Text>
        </Animated.View>

        {/* --- PERFORMANCE OVERVIEW CARD --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={16} color="#3B82F6" style={{marginRight: 8}} />
            <Text style={styles.cardTitle}>Performance Overview</Text>
          </View>
          
          <View style={styles.chartPlaceholderBox}>
             <Text style={styles.chartPlaceholderText}>Performance Chart Placeholder</Text>
          </View>
        </Animated.View>

        {/* --- CLASS PERFORMANCE CARD --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={16} color="#3B82F6" style={{marginRight: 8}} />
            <Text style={styles.cardTitle}>Class Performance</Text>
          </View>
          
          <View style={styles.chartPlaceholderBox}>
             <Text style={styles.chartPlaceholderText}>Class Performance Chart Placeholder</Text>
          </View>
        </Animated.View>

        {/* --- PERFORMANCE REPORTS CARD --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.cardContainer}>
          <View style={[styles.cardHeader, {marginBottom: 20}]}>
            <Text style={styles.cardTitle}>Performance Reports</Text>
          </View>
          
          {/* Report Item 1 */}
          <View style={styles.reportItemContainer}>
             <Text style={styles.reportTitle}>Term 1 Performance Report</Text>
             <Text style={styles.reportSubtitle}>Comprehensive analysis of student performance for Term 1</Text>
             <TouchableOpacity style={styles.viewReportBtn}>
               <Text style={styles.viewReportBtnText}>View Report</Text>
             </TouchableOpacity>
          </View>

          {/* Report Item 2 */}
          <View style={styles.reportItemContainer}>
             <Text style={styles.reportTitle}>Annual Performance Summary</Text>
             <Text style={styles.reportSubtitle}>Year-end performance summary and analytics</Text>
             <TouchableOpacity style={styles.viewReportBtn}>
               <Text style={styles.viewReportBtnText}>View Report</Text>
             </TouchableOpacity>
          </View>

        </Animated.View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' }, // Soft layout background
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 8
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },

  chartPlaceholderBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  reportItemContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 20,
  },
  viewReportBtn: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  viewReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  }
});

export default PrincipalPerformanceScreen;
