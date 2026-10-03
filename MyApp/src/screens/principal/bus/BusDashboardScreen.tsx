import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../store/ThemeContext';
import { Theme, withAlpha } from '../../../constants/theme';
import { NavigationDrawer } from '../../../components/NavigationDrawer';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { BusMapPlaceholder } from '../../../components/bus/BusMapPlaceholder';
import { busStore } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const BusDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic store data state
  const [buses, setBuses] = useState(busStore.getBuses());
  const [routes, setRoutes] = useState(busStore.getRoutes());
  const [schedules, setSchedules] = useState(busStore.getSchedules());
  const [drivers, setDrivers] = useState(busStore.getDrivers());

  useEffect(() => {
    const unsubscribe = busStore.subscribe(() => {
      setBuses(busStore.getBuses());
      setRoutes(busStore.getRoutes());
      setSchedules(busStore.getSchedules());
      setDrivers(busStore.getDrivers());
    });
    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setBuses(busStore.getBuses());
      setRoutes(busStore.getRoutes());
      setSchedules(busStore.getSchedules());
      setDrivers(busStore.getDrivers());
      setIsRefreshing(false);
    }, 600);
  };

  // Metrics calculation
  const totalBuses = buses.length;
  const activeTrips = schedules.filter(s => s.status === 'Active').length;
  const delayedBuses = buses.filter(b => b.status === 'In Maintenance').length;
  const activeVehicles = buses.filter(b => b.status === 'Active').length;
  const offlineVehicles = buses.length - activeVehicles;
  const studentsOnboard = buses.reduce((acc, b) => acc + (b.status === 'Active' ? 24 : 0), 0);

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      {/* Shared Header & Sub-Nav Bar */}
      <BusSubHeader
        activeTab="Dashboard"
        navigation={navigation}
        onOpenDrawer={() => setDrawerOpen(true)}
        title="Bus Tracking Dashboard"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* 1. Row of 5 Stat Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statCardsRow}
        >
          {/* Total Buses */}
          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.primary, 0.15) }]}>
              <Ionicons name="bus-outline" size={20} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{totalBuses}</Text>
            <Text style={styles.statLabel}>Total Buses</Text>
          </View>

          {/* Active Trips */}
          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.info, 0.1) }]}>
              <Ionicons name="navigate-outline" size={20} color={theme.info} />
            </View>
            <Text style={styles.statValue}>{activeTrips}</Text>
            <Text style={styles.statLabel}>Active Trips</Text>
          </View>

          {/* Delayed Buses (Critical/Red) */}
          <View style={[styles.statCard, styles.criticalStatCard]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.danger, 0.15) }]}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
            </View>
            <Text style={[styles.statValue, { color: theme.danger }]}>{delayedBuses}</Text>
            <Text style={[styles.statLabel, { color: theme.danger, fontWeight: '700' }]}>
              Delayed / Issue
            </Text>
          </View>

          {/* Active Vehicles */}
          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.success, 0.1) }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
            </View>
            <Text style={styles.statValue}>{activeVehicles}</Text>
            <Text style={styles.statLabel}>Active Vehicles</Text>
          </View>

          {/* Students Onboard */}
          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.secondary, 0.1) }]}>
              <Ionicons name="people-outline" size={20} color={theme.secondary} />
            </View>
            <Text style={styles.statValue}>{studentsOnboard}</Text>
            <Text style={styles.statLabel}>Students Onboard</Text>
          </View>
        </ScrollView>

        {/* 2. Mini Fleet Snapshot Panel */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleContainer}>
              <Ionicons name="map-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.panelTitle}>Mini Fleet Snapshot</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FleetTracking')}
            >
              <Text style={styles.panelActionText}>Full Screen →</Text>
            </TouchableOpacity>
          </View>

          <BusMapPlaceholder
            height={220}
            showLiveBadge={true}
            showRoutePath={true}
            onOpenFullMap={() => navigation.navigate('FleetTracking')}
            ctaText="Open Full Fleet Tracking"
          />
        </View>

        {/* 3. Priority Active Trips Panel */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleContainer}>
              <Ionicons name="flash-outline" size={20} color={theme.warning} style={{ marginRight: 8 }} />
              <Text style={styles.panelTitle}>Priority Active Trips</Text>
            </View>
            <View style={styles.badgePillAmber}>
              <Text style={styles.badgePillAmberText}>{activeTrips} Live</Text>
            </View>
          </View>

          {/* Empty State Banner */}
          <View style={styles.emptyStateBox}>
            <Ionicons name="bus-outline" size={36} color={theme.subtext} style={{ opacity: 0.5, marginBottom: 8 }} />
            <Text style={styles.emptyStateTitle}>No active priority trips at the moment</Text>
            <Text style={styles.emptyStateSubtitle}>
              All morning routes completed on schedule. Afternoon drop routes start at 02:30 PM.
            </Text>
          </View>

          {/* Online / Offline Vehicle Counts */}
          <View style={styles.statusCountFooter}>
            <View style={styles.statusCountItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <Text style={styles.statusCountText}>
                <Text style={{ fontWeight: '800', color: theme.text }}>{activeVehicles}</Text> Vehicles Online
              </Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusCountItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.subtext }]} />
              <Text style={styles.statusCountText}>
                <Text style={{ fontWeight: '800', color: theme.text }}>{offlineVehicles}</Text> Vehicles Offline
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Recent Activity Panel */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleContainer}>
              <Ionicons name="time-outline" size={20} color={theme.info} style={{ marginRight: 8 }} />
              <Text style={styles.panelTitle}>Recent Activity</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={{ padding: 4 }}>
              <Ionicons name="refresh-outline" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyStateBox}>
            <Ionicons name="document-text-outline" size={32} color={theme.subtext} style={{ opacity: 0.5, marginBottom: 6 }} />
            <Text style={styles.emptyStateTitle}>No recent activity</Text>
            <Text style={styles.emptyStateSubtitle}>
              System telemetry updates will appear here when buses start their next trip.
            </Text>
          </View>
        </View>

        {/* 5. Fleet Management Quick Actions List */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.panelTitle, { marginBottom: 14 }]}>Fleet Management Quick Actions</Text>

          {/* Action Row 1: Add New Bus */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: withAlpha(theme.primary, 0.1) }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddVehicle')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.primary }]}>
              <Ionicons name="bus-outline" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Add New Bus</Text>
              <Text style={styles.actionDesc}>Register a vehicle to your institution fleet</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>

          {/* Action Row 2: Create Route */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: withAlpha(theme.info, 0.1) }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RouteConfiguration')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.info }]}>
              <Ionicons name="map-outline" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Create Route</Text>
              <Text style={styles.actionDesc}>Configure route stops, geofences, and paths</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.info} />
          </TouchableOpacity>

          {/* Action Row 3: Assign Driver */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: withAlpha(theme.success, 0.1) }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddSchedule')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.success }]}>
              <Ionicons name="person-add-outline" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Assign Driver</Text>
              <Text style={styles.actionDesc}>Link driver to vehicle schedule timetable</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.success} />
          </TouchableOpacity>

          {/* Action Row 4: Enroll Student */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: withAlpha(theme.secondary, 0.1) }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EnrollStudent')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons name="school-outline" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Enroll Student</Text>
              <Text style={styles.actionDesc}>Assign student boarding & drop-off stops</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
          </TouchableOpacity>
        </View>

        {/* 6. Footer Line Banner */}
        <TouchableOpacity
          style={styles.footerBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RouteManagement')}
        >
          <View style={styles.footerBannerLeft}>
            <Ionicons name="git-network-outline" size={18} color={theme.onPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.footerBannerText}>
              {routes.length} active routes — Operational
            </Text>
          </View>
          <Text style={styles.footerBannerCta}>Manage →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    statCardsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingBottom: 16,
    },
    statCard: {
      width: 140,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    criticalStatCard: {
      backgroundColor: withAlpha(theme.danger, 0.1),
      borderColor: theme.danger,
    },
    statIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 2,
    },
    panelCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    panelHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    panelTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    panelTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    panelActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
    badgePillAmber: {
      backgroundColor: withAlpha(theme.warning, 0.15),
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: withAlpha(theme.warning, 0.3),
    },
    badgePillAmberText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.warning,
    },
    emptyStateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyStateTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 12,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
    statusCountFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statusCountItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusCountText: {
      fontSize: 13,
      color: theme.subtext,
    },
    statusDivider: {
      width: 1,
      height: 16,
      backgroundColor: theme.border,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
    },
    actionIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    actionTextContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    actionDesc: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
    },
    footerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    footerBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerBannerText: {
      color: theme.onPrimary,
      fontWeight: '700',
      fontSize: 14,
    },
    footerBannerCta: {
      color: theme.onPrimary,
      fontWeight: '800',
      fontSize: 13,
    },
  });
