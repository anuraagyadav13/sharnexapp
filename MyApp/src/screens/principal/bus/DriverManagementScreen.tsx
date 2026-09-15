import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { NavigationDrawer } from '../../../components/NavigationDrawer';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore, BusDriver } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const DriverManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [drivers, setDrivers] = useState<BusDriver[]>(busStore.getDrivers());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = busStore.subscribe(() => {
      setDrivers(busStore.getDrivers());
    });
    return unsubscribe;
  }, []);

  const filteredDrivers = drivers.filter(d => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query) ||
      d.licenseNumber.toLowerCase().includes(query) ||
      (d.assignedBusReg && d.assignedBusReg.toLowerCase().includes(query))
    );
  });

  const totalDrivers = drivers.length;
  const onDutyCount = drivers.filter(d => d.status === 'On Duty').length;
  const totalTrips = drivers.reduce((acc, d) => acc + d.totalTrips, 0);
  const avgRating = (drivers.reduce((acc, d) => acc + d.rating, 0) / (drivers.length || 1)).toFixed(1);

  const handleCallDriver = (name: string, phone: string) => {
    Alert.alert('Calling Driver', `Dialing ${name} at ${phone}...`);
  };

  const handleEmailDriver = (name: string, email: string) => {
    Alert.alert('Email Driver', `Opening mail client for ${name} (${email})...`);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      <BusSubHeader
        activeTab="Driver Management"
        navigation={navigation}
        onOpenDrawer={() => setDrawerOpen(true)}
        title="Driver Management"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Driver Management</Text>
            <Text style={styles.screenSubtitle}>Manage certified institution drivers</Text>
          </View>

          <TouchableOpacity
            style={styles.addDriverBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddDriver')}
          >
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addDriverBtnText}>Add Driver</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search driver name, ID, bus, or license..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stat Row */}
        <View style={styles.statGridRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.statNum}>{totalDrivers}</Text>
            <Text style={styles.statTxt}>Total Drivers</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{onDutyCount}</Text>
            <Text style={styles.statTxt}>On Duty</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#3B82F6' }]}>{totalTrips}</Text>
            <Text style={styles.statTxt}>Total Trips</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={[styles.statNum, { color: '#F59E0B' }]}>{avgRating}</Text>
            </View>
            <Text style={styles.statTxt}>Avg Rating</Text>
          </View>
        </View>

        {/* Driver Cards Grid */}
        <View style={styles.cardsGrid}>
          {filteredDrivers.map(item => {
            const isOnDuty = item.status === 'On Duty';
            return (
              <View
                key={item.id}
                style={[styles.driverCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.driverAvatarCircle}>
                    <Text style={styles.avatarInitialsText}>{item.initials}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.driverNameText}>{item.fullName}</Text>
                    <Text style={styles.driverIdText}>{item.id} • {item.licenseType}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusPill,
                      isOnDuty
                        ? (isDarkMode ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' } : { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' })
                        : (isDarkMode ? { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: 'rgba(148, 163, 184, 0.3)' } : { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }),
                    ]}
                  >
                    <View style={[styles.dotPill, { backgroundColor: isOnDuty ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[styles.statusPillText, { color: isOnDuty ? '#10B981' : '#64748B' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Assigned Rows */}
                <View style={styles.metaGroup}>
                  <View style={styles.metaRow}>
                    <Ionicons name="bus-outline" size={15} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={styles.metaLabel}>Assigned Bus:</Text>
                    <Text style={styles.metaVal}>{item.assignedBusReg || 'Unassigned'}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="map-outline" size={15} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={styles.metaLabel}>Route:</Text>
                    <Text style={styles.metaVal} numberOfLines={1}>{item.assignedRouteName || 'Unassigned'}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="card-outline" size={15} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={styles.metaLabel}>License Expiry:</Text>
                    <Text style={styles.metaVal}>{item.licenseExpiry}</Text>
                  </View>
                </View>

                {/* Rating & Trips Stat Pair */}
                <View style={styles.ratingTripsRow}>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={15} color="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingVal}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingSub}>/ 5.0 Rating</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.ratingBox}>
                    <Ionicons name="speedometer-outline" size={15} color="#7C3AED" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingVal}>{item.totalTrips}</Text>
                    <Text style={styles.ratingSub}>Completed Trips</Text>
                  </View>
                </View>

                {/* Bottom Actions Row */}
                <View style={styles.cardFooterActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    activeOpacity={0.7}
                    onPress={() => handleCallDriver(item.fullName, item.phone)}
                  >
                    <Ionicons name="call-outline" size={18} color="#10B981" />
                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    activeOpacity={0.7}
                    onPress={() => handleEmailDriver(item.fullName, item.email)}
                  >
                    <Ionicons name="mail-outline" size={18} color="#3B82F6" />
                    <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, { marginLeft: 'auto' }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AddDriver')}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#7C3AED" />
                    <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
      marginBottom: 14,
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
    addDriverBtn: {
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
    addDriverBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
    },
    statGridRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      borderRadius: 14,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    statNum: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    statTxt: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 2,
    },
    cardsGrid: {
      gap: 14,
    },
    driverCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    driverAvatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#7C3AED',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitialsText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 16,
    },
    driverNameText: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    driverIdText: {
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
    metaGroup: {
      gap: 6,
      marginBottom: 12,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginRight: 4,
    },
    metaVal: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
    },
    ratingTripsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
      borderRadius: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingVal: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      marginRight: 4,
    },
    ratingSub: {
      fontSize: 11,
      color: theme.subtext,
    },
    statDivider: {
      width: 1,
      height: 16,
      backgroundColor: theme.border,
    },
    cardFooterActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionIconBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
  });
