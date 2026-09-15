import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { NavigationDrawer } from '../../../components/NavigationDrawer';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore, BusVehicle } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const FleetTrackingScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<BusVehicle[]>(busStore.getBuses());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'In Maintenance'>('All');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<number | 'All'>('All');

  useEffect(() => {
    const unsubscribe = busStore.subscribe(() => {
      setVehicles(busStore.getBuses());
    });
    return unsubscribe;
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    if (selectedStatusFilter !== 'All' && v.status !== selectedStatusFilter) return false;
    if (selectedCapacityFilter !== 'All' && v.capacity < selectedCapacityFilter) return false;
    return true;
  });

  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const utilizationPercent = Math.round((activeCount / (vehicles.length || 1)) * 100);

  const renderVehicleItem = ({ item }: { item: BusVehicle }) => {
    const isActive = item.status === 'Active';
    return (
      <View style={[styles.tableRowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.vehicleHeaderRow}>
          <View style={styles.vehicleRegBox}>
            <View style={[styles.busIconBadge, { backgroundColor: isDarkMode ? '#26174A' : '#EDE9FE' }]}>
              <Ionicons name="bus-outline" size={20} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.regNumberText}>{item.registrationNumber}</Text>
              <Text style={styles.makeModelText}>{item.make} • {item.model}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isActive
                ? (isDarkMode ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' } : { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' })
                : (isDarkMode ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' } : { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }),
            ]}
          >
            <View style={[styles.dotPill, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusPillText, { color: isActive ? '#10B981' : '#EF4444' }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Details row */}
        <View style={styles.vehicleMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="hardware-chip-outline" size={15} color={theme.subtext} style={{ marginRight: 4 }} />
            <Text style={styles.metaLabel}>GPS:</Text>
            <Text style={styles.metaValue}>
              {item.gpsTrackingMethod === 'dedicated' ? 'Dedicated GPS Box' : 'Driver Mobile'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={15} color={theme.subtext} style={{ marginRight: 4 }} />
            <Text style={styles.metaLabel}>Seats:</Text>
            <Text style={styles.metaValue}>{item.capacity} Seats</Text>
          </View>
        </View>

        {item.assignedDriver && (
          <View style={styles.driverFooterRow}>
            <Ionicons name="person-circle-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text style={styles.driverFooterText}>Driver: {item.assignedDriver}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      <BusSubHeader
        activeTab="Fleet Tracking"
        navigation={navigation}
        onOpenDrawer={() => setDrawerOpen(true)}
        title="Fleet Management"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Top Header Row */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.screenTitle}>Fleet Management</Text>
            <Text style={styles.screenSubtitle}>Track & manage institution vehicles</Text>
          </View>
          <TouchableOpacity
            style={styles.addVehicleBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddVehicle')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Fleet Utilization Live-Style Progress Card */}
        <View style={[styles.utilizationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.utilHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pie-chart-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
              <Text style={styles.utilTitle}>Fleet Utilization</Text>
            </View>
            <Text style={styles.utilPercentText}>{utilizationPercent}% Active</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.fillBar, { width: `${utilizationPercent}%` }]} />
          </View>

          <View style={styles.utilStatsRow}>
            <Text style={styles.utilSubtext}>{activeCount} of {vehicles.length} Buses On-Duty</Text>
            <Text style={styles.utilSubtext}>{vehicles.length - activeCount} Maintenance/Standby</Text>
          </View>
        </View>

        {/* Quick Filters Card */}
        <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.filterSectionTitle}>Quick Filters</Text>

          {/* Status Filter Tabs */}
          <Text style={styles.filterLabel}>Vehicle Status</Text>
          <View style={styles.filterChipGroup}>
            {(['All', 'Active', 'In Maintenance'] as const).map(st => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterChip,
                  selectedStatusFilter === st && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatusFilter === st && styles.filterChipTextActive,
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Capacity Chip Toggles */}
          <Text style={styles.filterLabel}>Capacity Filter</Text>
          <View style={styles.filterChipGroup}>
            {[
              { label: 'All Seats', value: 'All' as const },
              { label: '35+ Seats', value: 35 },
              { label: '40+ Seats', value: 40 },
              { label: '45+ Seats', value: 45 },
            ].map(cap => (
              <TouchableOpacity
                key={cap.label}
                style={[
                  styles.filterChip,
                  selectedCapacityFilter === cap.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCapacityFilter(cap.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCapacityFilter === cap.value && styles.filterChipTextActive,
                  ]}
                >
                  {cap.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicles Table / Cards List */}
        <View style={{ marginBottom: 12 }}>
          {filteredVehicles.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="bus-outline" size={36} color={theme.subtext} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>No vehicles match the selected filter</Text>
            </View>
          ) : (
            filteredVehicles.map(item => <View key={item.id}>{renderVehicleItem({ item })}</View>)
          )}
        </View>

        {/* Pagination Footer */}
        <View style={styles.paginationFooter}>
          <Text style={styles.paginationText}>
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
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
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    screenSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 2,
    },
    addVehicleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#7C3AED',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 4,
    },
    addVehicleBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    utilizationCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    utilHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    utilTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    utilPercentText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#7C3AED',
    },
    progressTrack: {
      height: 10,
      backgroundColor: isDarkMode ? '#26174A' : '#EDE9FE',
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 8,
    },
    fillBar: {
      height: '100%',
      backgroundColor: '#7C3AED',
      borderRadius: 5,
    },
    utilStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    utilSubtext: {
      fontSize: 12,
      color: theme.subtext,
    },
    filterCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    filterSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 10,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 6,
      marginBottom: 8,
    },
    filterChipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: '#7C3AED',
      borderColor: '#7C3AED',
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    tableRowCard: {
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
    },
    vehicleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    vehicleRegBox: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    busIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    regNumberText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    makeModelText: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    dotPill: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    vehicleMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginRight: 4,
    },
    metaValue: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    driverFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    driverFooterText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 8,
    },
    paginationFooter: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    paginationText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
  });
