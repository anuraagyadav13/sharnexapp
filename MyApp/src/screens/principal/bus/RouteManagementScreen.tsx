import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { useTheme } from '../../../store/ThemeContext';
import { NavigationDrawer } from '../../../components/NavigationDrawer';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore, BusRoute } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const RouteManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [routes, setRoutes] = useState<BusRoute[]>(busStore.getRoutes());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Pickup' | 'Drop-off' | 'Both'>('All');

  useEffect(() => {
    const unsubscribe = busStore.subscribe(() => {
      setRoutes(busStore.getRoutes());
    });
    return unsubscribe;
  }, []);

  const filteredRoutes = routes.filter(r => {
    if (selectedTypeFilter !== 'All' && r.type !== selectedTypeFilter) return false;
    return true;
  });

  const totalStops = routes.reduce((acc, r) => acc + r.stopCount, 0);
  const avgHealth = Math.round(routes.reduce((acc, r) => acc + r.healthPercent, 0) / (routes.length || 1));

  const getGradientColors = (type: string) => {
    if (type === 'Pickup') return ['#7C3AED', '#3B82F6'];
    if (type === 'Drop-off') return ['#EC4899', '#8B5CF6'];
    return ['#059669', '#10B981'];
  };

  const handleDownloadManifest = (routeName: string) => {
    Alert.alert('Export Manifest', `Downloading PDF manifest & student stop list for "${routeName}"...`);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      <BusSubHeader
        activeTab="Routes"
        navigation={navigation}
        onOpenDrawer={() => setDrawerOpen(true)}
        title="Route Management"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.screenTitle}>Route Management</Text>
            <Text style={styles.screenSubtitle}>Configure pickup & drop corridors</Text>
          </View>
          <TouchableOpacity
            style={styles.buildRouteBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RouteConfiguration')}
          >
            <Ionicons name="map-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buildRouteBtnText}>Build New Route</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Type Filter:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {(['All', 'Pickup', 'Drop-off', 'Both'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterPill,
                  selectedTypeFilter === t && styles.filterPillActive,
                ]}
                onPress={() => setSelectedTypeFilter(t)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedTypeFilter === t && styles.filterPillTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stat Row */}
        <View style={styles.statGridRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.statNum}>{routes.length}</Text>
            <Text style={styles.statTxt}>Active Routes</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{avgHealth}%</Text>
            <Text style={styles.statTxt}>Avg. Health</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.statNum}>{totalStops}</Text>
            <Text style={styles.statTxt}>Total Stops</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#3B82F6' }]}>0</Text>
            <Text style={styles.statTxt}>System Alerts</Text>
          </View>
        </View>

        {/* Route Cards Grid */}
        <View style={styles.cardsGrid}>
          {filteredRoutes.map(item => {
            const gradColors = getGradientColors(item.type);
            return (
              <View
                key={item.id}
                style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Gradient Header with Decorative Wave */}
                <View style={styles.cardGradientHeader}>
                  <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                      <LinearGradient id={`grad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradColors[0]} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradColors[1]} stopOpacity="1" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#grad-${item.id})`} />
                    <Path
                      d="M 0,40 Q 60,10 140,50 T 300,30 L 300,90 L 0,90 Z"
                      fill="#FFFFFF"
                      opacity={0.15}
                    />
                  </Svg>

                  <View style={styles.gradHeaderContent}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type}</Text>
                    </View>
                    {item.isLive && (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Live</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.routeCodeText}>{item.code}</Text>
                  <Text style={styles.routeNameText} numberOfLines={1}>{item.name}</Text>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name="pulse-outline" size={16} color="#10B981" />
                      <Text style={styles.metricLabel}>Health:</Text>
                      <Text style={[styles.metricValue, { color: '#10B981' }]}>{item.healthPercent}%</Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Ionicons name="time-outline" size={16} color={theme.subtext} />
                      <Text style={styles.metricLabel}>Duration:</Text>
                      <Text style={styles.metricValue}>{item.estDurationMinutes} mins</Text>
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name="pin-outline" size={16} color="#7C3AED" />
                      <Text style={styles.metricLabel}>Stops:</Text>
                      <Text style={styles.metricValue}>{item.stopCount} Geofenced Stops</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Card Actions Footer */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('RouteConfiguration', { routeId: item.id })}
                  >
                    <Ionicons name="create-outline" size={16} color="#7C3AED" style={{ marginRight: 4 }} />
                    <Text style={styles.editBtnText}>Edit Route</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    activeOpacity={0.7}
                    onPress={() => handleDownloadManifest(item.name)}
                  >
                    <Ionicons name="download-outline" size={18} color={theme.subtext} />
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
    buildRouteBtn: {
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
    buildRouteBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.subtext,
      marginRight: 8,
    },
    filterPill: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterPillActive: {
      backgroundColor: '#7C3AED',
      borderColor: '#7C3AED',
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
    filterPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
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
      gap: 16,
    },
    routeCard: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardGradientHeader: {
      height: 100,
      padding: 14,
      justifyContent: 'space-between',
      position: 'relative',
    },
    gradHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typeBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    typeBadgeText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 11,
      textTransform: 'uppercase',
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#FFFFFF',
      marginRight: 4,
    },
    liveText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 10,
    },
    routeCodeText: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 12,
      fontWeight: '700',
    },
    routeNameText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '800',
    },
    cardBody: {
      padding: 14,
      gap: 10,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginLeft: 4,
      marginRight: 4,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.border,
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      paddingHorizontal: 14,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#26174A' : '#F5F3FF',
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#7C3AED',
    },
    downloadBtn: {
      padding: 6,
    },
  });
