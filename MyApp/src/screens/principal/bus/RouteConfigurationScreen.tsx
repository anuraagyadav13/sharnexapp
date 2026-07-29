import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { BusMapPlaceholder } from '../../../components/bus/BusMapPlaceholder';
import { busStore, BusRouteStop } from '../../../services/busMockData';

interface Props {
  navigation: any;
  route?: any;
}

export const RouteConfigurationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const existingRouteId = route?.params?.routeId;
  const existingRoute = busStore.getRoutes().find(r => r.id === existingRouteId);

  // Form state
  const [routeName, setRouteName] = useState(existingRoute?.name || '');
  const [routeCode, setRouteCode] = useState(existingRoute?.code || `RT-EXP-0${busStore.getRoutes().length + 1}`);
  const [routeType, setRouteType] = useState<'Pickup' | 'Drop-off' | 'Both'>(existingRoute?.type || 'Pickup');
  const [newStopAddress, setNewStopAddress] = useState('');

  const [stops, setStops] = useState<BusRouteStop[]>(
    existingRoute?.stops || [
      { id: 's1', sequence: 1, name: 'Hebbal Circle Arch', address: 'Hebbal Main Rd', eta: '07:15 AM', geofenceRadiusMeters: 150 },
      { id: 's2', sequence: 2, name: 'RT Nagar Post Office', address: '8th Main Rd', eta: '07:25 AM', geofenceRadiusMeters: 100 },
      { id: 's3', sequence: 3, name: 'School Main Gate', address: 'Campus Central Arch', eta: '07:45 AM', geofenceRadiusMeters: 200 },
    ]
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleAddStop = () => {
    if (!newStopAddress.trim()) return;
    const nextSeq = stops.length + 1;
    const newStopItem: BusRouteStop = {
      id: `s-${Date.now()}`,
      sequence: nextSeq,
      name: newStopAddress.trim(),
      address: `${newStopAddress.trim()} Junction`,
      eta: `07:${15 + nextSeq * 10} AM`,
      geofenceRadiusMeters: 150,
    };
    setStops([...stops, newStopItem]);
    setNewStopAddress('');
  };

  const handleRemoveStop = (id: string) => {
    const updated = stops
      .filter(s => s.id !== id)
      .map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(updated);
  };

  const handleOptimizePath = () => {
    Alert.alert('AI Path Optimizer', 'Stops re-ordered based on real-time traffic flow & minimum total distance!');
  };

  const handleSaveRoute = () => {
    if (!routeName.trim()) {
      setErrors({ routeName: 'Route name is required' });
      return;
    }

    // TODO: replace with API call
    busStore.addRoute({
      code: routeCode.trim().toUpperCase(),
      name: routeName.trim(),
      type: routeType,
      healthPercent: 96,
      estDurationMinutes: stops.length * 12,
      stopCount: stops.length,
      stops: stops,
      isLive: true,
    });

    Alert.alert('Success', `Route "${routeName}" saved & published!`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <BusSubHeader
        activeTab="Routes"
        navigation={navigation}
        title={existingRoute ? 'Edit Route' : 'Build New Route'}
        isStackSubScreen={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>{existingRoute ? 'Edit Route Configuration' : 'Build Route & Geofences'}</Text>
          <Text style={styles.pageSubtitle}>Define sequence, stop coordinates, and live path</Text>
        </View>

        {/* Panel 1: Route Form */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="map-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Route Details</Text>
          </View>

          {/* Route Code & Name */}
          <View style={styles.inputRowGroup}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Route Code *</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={routeCode}
                onChangeText={setRouteCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>Route Name *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: errors.routeName ? '#EF4444' : theme.border },
                ]}
                placeholder="e.g. Northern Express"
                placeholderTextColor={theme.placeholder}
                value={routeName}
                onChangeText={setRouteName}
              />
              {errors.routeName && <Text style={styles.errorText}>{errors.routeName}</Text>}
            </View>
          </View>

          {/* Type Toggle */}
          <Text style={styles.inputLabel}>Route Type</Text>
          <View style={styles.typeToggleGroup}>
            {(['Pickup', 'Drop-off', 'Both'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeToggleBtn,
                  routeType === t && styles.typeToggleBtnActive,
                ]}
                onPress={() => setRouteType(t)}
              >
                <Text
                  style={[
                    styles.typeToggleText,
                    routeType === t && styles.typeToggleTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add New Stop Input */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Add New Stop Address</Text>
          <View style={styles.addStopRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
              placeholder="Search address or landmark..."
              placeholderTextColor={theme.placeholder}
              value={newStopAddress}
              onChangeText={setNewStopAddress}
            />
            <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.8} onPress={handleAddStop}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Draggable Stop Sequence List */}
          <View style={styles.stopsHeaderRow}>
            <Text style={styles.stopsHeaderTitle}>Stop Sequence ({stops.length})</Text>
            <TouchableOpacity onPress={handleOptimizePath}>
              <Text style={styles.optimizeLinkText}>⚡ Optimize Path</Text>
            </TouchableOpacity>
          </View>

          {stops.map(s => (
            <View key={s.id} style={[styles.stopItemRow, { backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC', borderColor: theme.border }]}>
              <View style={styles.stopNumCircle}>
                <Text style={styles.stopNumText}>{s.sequence}</Text>
              </View>
              <View style={styles.stopTextContent}>
                <Text style={styles.stopNameText}>{s.name}</Text>
                <Text style={styles.stopEtaText}>ETA: {s.eta}</Text>
              </View>

              {/* Geofence Chip */}
              <View style={styles.geofenceChip}>
                <Ionicons name="radio-outline" size={12} color="#7C3AED" style={{ marginRight: 4 }} />
                <Text style={styles.geofenceChipText}>{s.geofenceRadiusMeters}m</Text>
              </View>

              <TouchableOpacity onPress={() => handleRemoveStop(s.id)} style={{ padding: 4, marginLeft: 6 }}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Panel 2: Interactive Map Panel */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="navigate-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Interactive Path Preview</Text>
          </View>

          <BusMapPlaceholder
            height={220}
            showLiveBadge={true}
            showRoutePath={true}
          />

          {/* Map Bottom Bar (Distance & Est Time) */}
          <View style={styles.mapMetricsBar}>
            <View style={styles.mapMetricItem}>
              <Ionicons name="analytics-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={styles.mapMetricText}>Distance: <Text style={{ fontWeight: '800', color: theme.text }}>14.2 km</Text></Text>
            </View>
            <View style={styles.mapMetricDivider} />
            <View style={styles.mapMetricItem}>
              <Ionicons name="time-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={styles.mapMetricText}>Est. Time: <Text style={{ fontWeight: '800', color: theme.text }}>{stops.length * 12} mins</Text></Text>
            </View>
          </View>

          <TouchableOpacity style={styles.mapOptimizeCta} activeOpacity={0.8} onPress={handleOptimizePath}>
            <Ionicons name="flash-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.mapOptimizeCtaText}>Auto-Optimize Stop Sequence</Text>
          </TouchableOpacity>
        </View>

        {/* Action Links & Save Buttons */}
        <View style={styles.exportLinksRow}>
          <TouchableOpacity onPress={() => Alert.alert('Print Manifest', 'Generating printable PDF manifest...')}>
            <Text style={styles.exportLinkText}>🖨️ Print Manifest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Export CSV', 'Exporting route stops to CSV...')}>
            <Text style={styles.exportLinkText}>📊 Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={handleSaveRoute}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Save Route</Text>
          </TouchableOpacity>
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
    headerTitleRow: {
      marginBottom: 16,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 2,
    },
    panelCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    panelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    panelTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    inputRowGroup: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    textInput: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 14,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    errorText: {
      fontSize: 11,
      color: '#EF4444',
      marginTop: 4,
      fontWeight: '600',
    },
    typeToggleGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    typeToggleBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
    },
    typeToggleBtnActive: {
      backgroundColor: '#7C3AED',
      borderColor: '#7C3AED',
    },
    typeToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    typeToggleTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    addStopRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    addStopBtn: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: '#7C3AED',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
      marginBottom: 10,
    },
    stopsHeaderTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    optimizeLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#7C3AED',
    },
    stopItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
    },
    stopNumCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#7C3AED',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    stopNumText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 12,
    },
    stopTextContent: {
      flex: 1,
    },
    stopNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    stopEtaText: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 2,
    },
    geofenceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#26174A' : '#EDE9FE',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    geofenceChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#7C3AED',
    },
    mapMetricsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 12,
      paddingVertical: 10,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mapMetricItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mapMetricText: {
      fontSize: 13,
      color: theme.subtext,
    },
    mapMetricDivider: {
      width: 1,
      height: 16,
      backgroundColor: theme.border,
    },
    mapOptimizeCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#7C3AED',
      paddingVertical: 10,
      borderRadius: 20,
      marginTop: 12,
    },
    mapOptimizeCtaText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    exportLinksRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    exportLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#7C3AED',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    submitBtn: {
      flex: 2,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#7C3AED',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
